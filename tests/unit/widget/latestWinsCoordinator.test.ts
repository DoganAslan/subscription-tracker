import { createLatestWinsCoordinator } from '@/services/background/latestWinsCoordinator';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const createDeferred = <T,>(): Deferred<T> => {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, resolve: resolvePromise, reject: rejectPromise };
};

const flushCoordinator = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const settleWithinMicrotasks = async <T,>(promise: Promise<T>) => {
  let settled = false;
  let value: T | undefined;
  let reason: unknown;
  void promise.then(
    result => {
      settled = true;
      value = result;
    },
    error => {
      settled = true;
      reason = error;
    },
  );
  await flushCoordinator();
  return { settled, value, reason };
};

describe('createLatestWinsCoordinator', () => {
  it('executes the running request and only the newest request submitted while it runs', async () => {
    const firstRun = createDeferred<string>();
    const finalRun = createDeferred<string>();
    const run = jest.fn((input: string) => input === 'A' ? firstRun.promise : finalRun.promise);
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    const a = coordinator.submit('A');
    await flushCoordinator();
    const b = coordinator.submit('B');
    const c = coordinator.submit('C');

    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenLastCalledWith('A');

    firstRun.resolve('result A');
    await flushCoordinator();

    expect(run).toHaveBeenCalledTimes(2);
    expect(run).toHaveBeenLastCalledWith('C');

    finalRun.resolve('result C');

    await expect(a).resolves.toBe('result A');
    await expect(b).resolves.toBe('result C');
    await expect(c).resolves.toBe('result C');
  });

  it('returns null without a second run for a sequential duplicate completed key', async () => {
    const run = jest.fn(async (input: { id: string }) => `rendered ${input.id}`);
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: { id: string }) => input.id, run });

    await expect(coordinator.submit({ id: 'same' })).resolves.toBe('rendered same');
    await expect(coordinator.submit({ id: 'same' })).resolves.toBeNull();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('settles a request submitted immediately after an awaited successful request', async () => {
    const run = jest.fn(async (input: string) => `rendered ${input}`);
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    expect(await coordinator.submit('A')).toBe('rendered A');
    expect(await settleWithinMicrotasks(coordinator.submit('B'))).toEqual({
      settled: true,
      value: 'rendered B',
      reason: undefined,
    });

    expect(run).toHaveBeenNthCalledWith(1, 'A');
    expect(run).toHaveBeenNthCalledWith(2, 'B');
  });

  it('settles a request submitted immediately after an awaited rejection', async () => {
    const run = jest.fn((input: string) => input === 'A'
      ? Promise.reject(new Error('render failed'))
      : Promise.resolve('rendered B'));
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    try {
      await coordinator.submit('A');
      throw new Error('expected the first render to reject');
    } catch (error) {
      expect(error).toHaveProperty('message', 'render failed');
    }
    expect(await settleWithinMicrotasks(coordinator.submit('B'))).toEqual({
      settled: true,
      value: 'rendered B',
      reason: undefined,
    });

    expect(run).toHaveBeenNthCalledWith(1, 'A');
    expect(run).toHaveBeenNthCalledWith(2, 'B');
  });

  it('settles an active duplicate with null without rendering it a second time', async () => {
    const deferred = createDeferred<string>();
    const run = jest.fn(() => deferred.promise);
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    const active = coordinator.submit('A');
    await flushCoordinator();

    expect(await settleWithinMicrotasks(coordinator.submit('A'))).toEqual({
      settled: true,
      value: null,
      reason: undefined,
    });
    expect(run).toHaveBeenCalledTimes(1);

    deferred.resolve('rendered A');
    await expect(active).resolves.toBe('rendered A');
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('does not restore a completed key from work that finishes after reset', async () => {
    const deferred = createDeferred<string>();
    const run = jest.fn((input: string) => input === 'A' ? deferred.promise : Promise.resolve(`rendered ${input}`));
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    const active = coordinator.submit('A');
    await flushCoordinator();
    coordinator.reset();
    deferred.resolve('rendered A');

    await expect(active).resolves.toBe('rendered A');
    await expect(coordinator.submit('A')).resolves.toBe('rendered A');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('settles pending pre-reset callers with null while allowing the current generation to render', async () => {
    const activeRun = createDeferred<string>();
    const run = jest.fn((input: string) => input === 'A' ? activeRun.promise : Promise.resolve(`rendered ${input}`));
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    const active = coordinator.submit('A');
    await flushCoordinator();
    const pending = coordinator.submit('B');
    coordinator.reset();

    await expect(pending).resolves.toBeNull();
    const currentGeneration = coordinator.submit('A');
    activeRun.resolve('rendered old A');

    await expect(active).resolves.toBe('rendered old A');
    await expect(currentGeneration).resolves.toBe('rendered old A');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('does not suppress a same-key request submitted after reset while the old key is active', async () => {
    const oldRun = createDeferred<string>();
    let runCount = 0;
    const run = jest.fn((input: string) => {
      runCount += 1;
      return runCount === 1 ? oldRun.promise : Promise.resolve(`rendered new ${input}`);
    });
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    const oldRequest = coordinator.submit('A');
    await flushCoordinator();
    coordinator.reset();
    const newRequest = coordinator.submit('A');

    oldRun.resolve('rendered old A');

    await expect(oldRequest).resolves.toBe('rendered old A');
    await expect(newRequest).resolves.toBe('rendered new A');
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('settles callers replaced into a rejected final batch and recovers for a later request', async () => {
    const firstRun = createDeferred<string>();
    const rejectedFinalRun = createDeferred<string>();
    const rejection = new Error('render failed');
    const run = jest.fn((input: string) => {
      if (input === 'A') return firstRun.promise;
      if (input === 'C') return rejectedFinalRun.promise;
      return Promise.resolve('result D');
    });
    const coordinator = createLatestWinsCoordinator({ keyOf: (input: string) => input, run });

    const a = coordinator.submit('A');
    await flushCoordinator();
    const b = coordinator.submit('B');
    const c = coordinator.submit('C');
    const bRejection = expect(b).rejects.toThrow('render failed');
    const cRejection = expect(c).rejects.toThrow('render failed');

    firstRun.resolve('result A');
    await flushCoordinator();
    rejectedFinalRun.reject(rejection);

    await expect(a).resolves.toBe('result A');
    await bRejection;
    await cRejection;
    await expect(coordinator.submit('D')).resolves.toBe('result D');

    expect(run).toHaveBeenCalledWith('D');
  });
});

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

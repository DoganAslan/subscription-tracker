type DeferredCaller<R> = {
  resolve: (value: R | null) => void;
  reject: (reason: unknown) => void;
};

type PendingBatch<T, R> = {
  input: T;
  key: string;
  callers: DeferredCaller<R>[];
};

export interface LatestWinsCoordinator<T, R> {
  submit: (input: T) => Promise<R | null>;
  reset: () => void;
}

export function createLatestWinsCoordinator<T, R>({
  keyOf,
  run,
}: {
  keyOf: (input: T) => string;
  run: (input: T) => Promise<R>;
}): LatestWinsCoordinator<T, R> {
  let pending: PendingBatch<T, R> | null = null;
  let running = false;
  let lastCompletedKey: string | null = null;
  let drainPromise: Promise<void> | null = null;

  const drain = async () => {
    while (pending) {
      const batch = pending;
      pending = null;
      running = true;

      try {
        const result = await run(batch.input);
        lastCompletedKey = batch.key;
        batch.callers.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        batch.callers.forEach(({ reject }) => reject(error));
      } finally {
        running = false;
      }
    }
  };

  const beginDrain = () => {
    if (drainPromise) return;
    drainPromise = drain().finally(() => {
      drainPromise = null;
    });
  };

  return {
    submit(input) {
      const key = keyOf(input);
      if (!running && !pending && key === lastCompletedKey) {
        return Promise.resolve(null);
      }

      return new Promise<R | null>((resolve, reject) => {
        if (pending) {
          pending.input = input;
          pending.key = key;
          pending.callers.push({ resolve, reject });
        } else {
          pending = { input, key, callers: [{ resolve, reject }] };
        }
        beginDrain();
      });
    },
    reset() {
      lastCompletedKey = null;
    },
  };
}

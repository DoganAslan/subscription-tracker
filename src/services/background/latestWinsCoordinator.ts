type DeferredCaller<R> = {
  resolve: (value: R | null) => void;
  reject: (reason: unknown) => void;
};

type PendingBatch<T, R> = {
  input: T;
  key: string;
  generation: number;
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
  let runningKey: string | null = null;
  let runningGeneration: number | null = null;
  let lastCompletedKey: string | null = null;
  let drainPromise: Promise<void> | null = null;
  let resetGeneration = 0;

  const releaseDrain = () => {
    running = false;
    runningKey = null;
    runningGeneration = null;
    drainPromise = null;
  };

  const drain = async () => {
    while (pending) {
      const batch = pending;
      pending = null;
      running = true;
      runningKey = batch.key;
      runningGeneration = batch.generation;

      try {
        const result = await run(batch.input);
        if (batch.generation === resetGeneration) {
          lastCompletedKey = batch.key;
        }
        if (!pending) releaseDrain();
        batch.callers.forEach(({ resolve }) => resolve(result));
      } catch (error) {
        if (!pending) releaseDrain();
        batch.callers.forEach(({ reject }) => reject(error));
      }
    }
    releaseDrain();
  };

  const beginDrain = () => {
    if (drainPromise) return;
    drainPromise = drain();
  };

  return {
    submit(input) {
      const key = keyOf(input);
      if (!running && !pending && key === lastCompletedKey) {
        return Promise.resolve(null);
      }
      if (
        (key === runningKey && runningGeneration === resetGeneration)
        || (key === pending?.key && pending?.generation === resetGeneration)
      ) {
        return Promise.resolve(null);
      }

      return new Promise<R | null>((resolve, reject) => {
        if (pending) {
          pending.input = input;
          pending.key = key;
          pending.generation = resetGeneration;
          pending.callers.push({ resolve, reject });
        } else {
          pending = { input, key, generation: resetGeneration, callers: [{ resolve, reject }] };
        }
        beginDrain();
      });
    },
    reset() {
      resetGeneration += 1;
      lastCompletedKey = null;
      if (pending) {
        pending.callers.forEach(({ resolve }) => resolve(null));
        pending = null;
      }
    },
  };
}

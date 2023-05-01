export type PromiseFn<T extends any[], R> = (...args: T) => Promise<R>

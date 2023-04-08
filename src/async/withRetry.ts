type NewType<T extends any[], R> = (...args: T) => Promise<R>

export function withRetry<T extends any[], R>(fn: NewType<T, R>, maxRetries = 3): NewType<T, R> {
  return async function retry(...args) {
    let retries = 0

    while (true) {
      try {
        return await fn(...args)
      }
      catch (error) {
        if (retries >= maxRetries)
          throw error
        retries++
        console.warn(`Retry ${retries} times due to error: `, error)
      }
    }
  }
}

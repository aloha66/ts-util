type NewType<T extends any[], R> = (...args: T) => Promise<R>

export function withRetry(maxRetries = 3) {
  return function<T extends any[], R> (fn: NewType<T, R>): NewType<T, R> {
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
}

import type { PromiseFn } from '../type'

export function asyncTimeout(ms = 5000) {
  return function<T extends any[], R>(fn: PromiseFn<T, R>) {
    return function (...args: T) {
      return Promise.race([fn(...args), new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Timeout')), ms))])
    }
  }
}

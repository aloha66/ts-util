import { describe, expect, it, vi } from 'vitest'
import { asyncTimeout } from '../async/asyncTimeout'
import { withRetry } from '../async'
import { compose } from './compose'

// 异步操作函数
function asyncOperation(...args) {
  console.log('args0',args);
  
  return new Promise((resolve, reject) => {
    // 随机生成一个数字
    const num = Math.random()
    // 如果小于0.5，就表示成功
    if (num < 0.5) {
      resolve(num)
    }
    // 否则就表示失败
    else {
      reject(new Error('Operation failed'))
    }
  })
}

  // const composeFn = compose(asyncTimeout(2000),
    // withRetry(4))
    

    // const composeFnDDD = await  composeFn(asyncOperation)

    //  const dd = await composeFnDDD({a:2})
    //  console.log('dd',dd);

describe('compose', () => {
  it('composes from right to left', () => {
    const double = (x: number) => x * 2
    const square = (x: number) => x * x
    expect(compose(square)(5)).toBe(25)
    expect(compose(square, double)(5)).toBe(100)
    expect(compose(double, square, double)(5)).toBe(200)
  })

  it('composes functions from right to left', () => {
    const a = (next: (x: string) => string) => (x: string) => next(`${x}a`)
    const b = (next: (x: string) => string) => (x: string) => next(`${x}b`)
    const c = (next: (x: string) => string) => (x: string) => next(`${x}c`)
    const final = (x: string) => x

    expect(compose(a, b, c)(final)('')).toBe('abc')
    expect(compose(b, c, a)(final)('')).toBe('bca')
    expect(compose(c, a, b)(final)('')).toBe('cab')
  })

  it('throws at runtime if argument is not a function', () => {
      type sFunc = (x: number, y: number) => number
      const square = (x: number, _: number) => x * x
      const add = (x: number, y: number) => x + y

      expect(() =>
        compose(square, add, false as unknown as sFunc)(1, 2),
      ).toThrow()
      // @ts-expect-error let me do it
      expect(() => compose(square, add, undefined)(1, 2)).toThrow()
      expect(() =>
        compose(square, add, true as unknown as sFunc)(1, 2),
      ).toThrow()
      expect(() =>
        compose(square, add, NaN as unknown as sFunc)(1, 2),
      ).toThrow()
      expect(() =>
        compose(square, add, '42' as unknown as sFunc)(1, 2),
      ).toThrow()
  })

  it('can be seeded with multiple arguments', () => {
    const square = (x: number, _: number) => x * x
    const add = (x: number, y: number) => x + y
    expect(compose(square, add)(1, 2)).toBe(9)
  })

  it('returns the first given argument if given no functions', () => {
    expect(compose<number>()(1, 2)).toBe(1)
    expect(compose()(3)).toBe(3)
    expect(compose()(undefined)).toBe(undefined)
  })

  it('returns the first function if given only one', () => {
    const fn = () => {}

    expect(compose(fn)).toBe(fn)
  })
})

describe('compose timeout or retry', () => {
  it('compose asyncTimeout and withRetry with success at first try', async () => {
    // create a mock function that always succeeds
    const mockFn = vi.fn().mockResolvedValue('success')
     

    const composedFunction = await compose<() => string>(
      asyncTimeout(2000),
    withRetry(4),
    )(mockFn)

    // compose asyncTimeout and withRetry with the mock function
    // const composedFn = compose(asyncTimeout(1000), withRetry(2))(mockFn)
    // expect the composed function to resolve with 'success' at first try
    await expect(composedFunction()).resolves.toBe('success')

    // expect the mock function to be called once
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
  // // a mock async function that may fail or timeout
  // const mockAsync = (ms: number, fail: boolean) => {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       if (fail)
  //         reject(new Error('Fail'))

  //       else
  //         resolve('Success')
  //     }, ms)
  //   })
  // }

  // // a composed function that combines asyncTimeout and withRetry
  // const composed = compose(asyncTimeout(3000), withRetry(2))

  // // test the success case
  // it('should resolve the promise if it succeeds within the timeout and retries', async () => {
  //   const result = await composed(() => mockAsync(1000, false))
  //   expect(result).toBe('Success')
  // })

  // // test the timeout case
  // it('should reject the promise with a timeout error if it exceeds the timeout', async () => {
  //   await expect(composed(() => mockAsync(5000, false))).rejects.toThrow('Timeout')
  // })

  // // test the fail case
  // it('should reject the promise with a fail error if it fails after the retries', async () => {
  //   await expect(composed(() => mockAsync(1000, true))).rejects.toThrow('Fail')
  // })
})

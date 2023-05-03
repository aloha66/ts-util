import { describe, expect, it, vi } from 'vitest'
import { asyncTimeout, withRetry } from '../async'
import { FAIL, SUCCESS, TIMEOUT, sleep } from '../util'
import type { PromiseFn } from '../type'
import { compose } from './compose'

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

// 1. 超时执行
// 2. 错误重试
// 3. 暂停开始

function mergeAsyncAbility<T extends any[], R>(fn: PromiseFn<T, R>, options: any[]) {
  const asyncFn = async function (...args: T): Promise<R> {
    return await fn(...args)
  }

  return compose<PromiseFn<T, R>>(
    ...options,
    // withRetry(retryTimes),
    // asyncTimeout(asyncTimeoutMs),
  )(asyncFn)
}

describe('compose timeout or retry', () => {
  it('错误，全部错误，默认3次重试', async () => {
    // create a mock function that returns a rejected promise always
    const mockFn = vi.fn().mockRejectedValue(new Error(FAIL))

    async function target() {
      await sleep(0)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry()])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(FAIL)
    expect(mockFn).toHaveBeenCalledTimes(4)
  })

  it('错误，全部错误，重试4次', async () => {
    // create a mock function that returns a rejected promise always
    const mockFn = vi.fn().mockRejectedValue(new Error(FAIL))

    async function target() {
      await sleep(0)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry(4)])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(FAIL)
    expect(mockFn).toHaveBeenCalledTimes(5)
  })
  it('错误，全部错误,优先级是超时，且超时', async () => {
    // create a mock function that returns a rejected promise always
    const mockFn = vi.fn().mockRejectedValue(new Error(FAIL))

    async function target() {
      await sleep(300)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry()])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(TIMEOUT)
    expect(mockFn).toHaveBeenCalledTimes(0)
  })

  it('错误，全部错误,优先级是错误重试，且超时,错误信息是最后一次的错误信息，所以是超时和只执行了两次', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error(FAIL))

    async function target() {
      await sleep(300)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [withRetry(), asyncTimeout(100)])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(TIMEOUT)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('错误，两次错误，最后一次成功，优先级是超时，因累计任务时长会超过超时，所以mock只会调两次', async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error(FAIL))
      .mockRejectedValueOnce(new Error(FAIL))
      .mockResolvedValueOnce('success')
    async function target() {
      await sleep(33)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry()])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(TIMEOUT)
    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('错误，目标时间比预设时间慢，且功能优先级是超时，100ms后程序就会停止，mock不会被调用', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error(TIMEOUT))

    async function target() {
      await sleep(200)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry()])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(TIMEOUT)
    expect(mockFn).toHaveBeenCalledTimes(0)
  })

  it('错误，目标时间比预设时间慢，且功能优先级是错误重试，所以会试三次，每次的超时时间是100ms', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error(TIMEOUT))

    async function target() {
      await sleep(200)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [withRetry(), asyncTimeout(100)])
    await expect(connectWithAsyncAbilities()).rejects.toThrow(TIMEOUT)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('成功，没有超时，没有错误，优先级是超时,一次完成', async () => {
    const mockFn = vi.fn().mockResolvedValue(SUCCESS)

    async function target() {
      await sleep(0)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry()])

    await expect(connectWithAsyncAbilities()).resolves.toBe(SUCCESS)
    // check that the mock was called once
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('成功，没有超时，没有错误，优先级是错误重试,一次完成', async () => {
    const mockFn = vi.fn().mockResolvedValue(SUCCESS)

    async function target() {
      await sleep(0)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [withRetry(), asyncTimeout(100)])
    await expect(connectWithAsyncAbilities()).resolves.toBe(SUCCESS)
    // check that the mock was called once
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('成功，两次错误，最后一次成功，优先级是超时，且每个任务时间远短与超时时长', async () => {
    // create a mock function that always succeeds
    const mockFn = vi.fn().mockRejectedValueOnce(new Error(FAIL))
      .mockRejectedValueOnce(new Error(FAIL))
      .mockResolvedValueOnce('success')
    async function target() {
      await sleep(10)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [asyncTimeout(100), withRetry()])
    await expect(connectWithAsyncAbilities()).resolves.toBe(SUCCESS)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('成功，两次错误，最后一次成功，优先级是错误重试，且每个任务时间远短与超时时长', async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error(FAIL))
      .mockRejectedValueOnce(new Error(FAIL))
      .mockResolvedValueOnce('success')
    async function target() {
      await sleep(10)
      return mockFn()
    }

    const connectWithAsyncAbilities = mergeAsyncAbility(target, [withRetry(), asyncTimeout(100)])
    await expect(connectWithAsyncAbilities()).resolves.toBe(SUCCESS)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })
})

describe('compose in class', () => {
  function withAsyncAbilitiesDecorator<T extends any[], R>(options: { timeout?: number; maxRetries?: number } = {}) {
    const { timeout = 100, maxRetries = 3 } = options
    return function (_target: any, _propertyKey: string, descriptor: TypedPropertyDescriptor<PromiseFn<T, R>>) {
      if (descriptor.value !== undefined)
        descriptor.value = mergeAsyncAbility(descriptor.value, [asyncTimeout(timeout), withRetry(maxRetries)])

      else
        throw new Error('Only decorate methods')
    }
  }

  it('装饰器实现,全部失败', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error(FAIL))

    class Test {
      @withAsyncAbilitiesDecorator()
      async connect() {
        return mockFn()
      }
    }
    const t = new Test()
    await expect(t.connect()).rejects.toThrow(FAIL)
    expect(mockFn).toHaveBeenCalledTimes(4)
  })

  it('装饰器实现,超时失败', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error(FAIL))

    class Test {
      @withAsyncAbilitiesDecorator()
      async connect() {
        await sleep(300)
        return mockFn()
      }
    }
    const t = new Test()
    await expect(t.connect()).rejects.toThrow(TIMEOUT)
    expect(mockFn).toHaveBeenCalledTimes(0)
  })

  it('装饰器实现,失败两次，成功一次', async () => {
    const mockFn = vi.fn().mockRejectedValueOnce(new Error(FAIL))
      .mockRejectedValueOnce(new Error(FAIL))
      .mockResolvedValueOnce(SUCCESS)

    class Test {
      @withAsyncAbilitiesDecorator()
      async connect() {
        return mockFn()
      }
    }
    const t = new Test()
    await expect(t.connect()).resolves.toBe(SUCCESS)
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('装饰器实现，一次成功', async () => {
    const mockFn = vi.fn().mockResolvedValue(SUCCESS)

    class Test {
      @withAsyncAbilitiesDecorator()
      async connect() {
        return mockFn()
      }
    }
    const t = new Test()
    await expect(t.connect()).resolves.toBe(SUCCESS)
    expect(mockFn).toHaveBeenCalledTimes(1)
  })
})

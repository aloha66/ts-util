import { fail } from 'assert'
import { describe, expect, it } from 'vitest'
import { asyncTimeout } from './asyncTimeout'

describe('asyncTimeout', () => {
  it('should reject the original promise if it is slower than timeout', async () => {
    // 定义一个原 promise，等待 200 毫秒后 resolve
    const originalPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve('OK')
      }, 200)
    })

    const timeout = 100
    try {
      await asyncTimeout(timeout)(originalPromise)
      fail('should not reach here')
    }
    catch (e) {
      expect(e).toBeInstanceOf(Error) // 断言接受到变量的类实例
      e instanceof Error && expect(e.message).toBe('Timeout')
    }
  })

  it('asyncTimeout should resolve the original promise if it is faster than timeout', async () => {
    const originalPromise = new Promise(resolve => setTimeout(() => resolve('hello'), 100))
    const result = await asyncTimeout(200)(originalPromise)
    expect(result).toBe('hello')
  })
})

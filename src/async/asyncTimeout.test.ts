import { fail } from 'assert'
import { describe, expect, it } from 'vitest'
import { SUCCESS, TIMEOUT, returnFailPromise, returnSuccessPromise } from '../util'
import { asyncTimeout } from './asyncTimeout'

describe('asyncTimeout', () => {
  it('should reject the original promise if it is slower than timeout', async () => {
    const timeout = 100
    const condition = asyncTimeout(timeout)
    const action = condition(returnFailPromise)
    try {
      await action(200, TIMEOUT)
      fail('should not reach here')
    }
    catch (e) {
      expect(e).toBeInstanceOf(Error) // 断言接受到变量的类实例
      e instanceof Error && expect(e.message).toBe(TIMEOUT)
    }
  })

  it('asyncTimeout should resolve the original promise if it is faster than timeout', async () => {
    const result = await asyncTimeout(200)(returnSuccessPromise)()
    expect(result).toBe(SUCCESS)
  })
})

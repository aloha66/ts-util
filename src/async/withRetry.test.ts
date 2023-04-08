import { afterEach, describe, expect, it, vi } from 'vitest'
import { withRetry } from './withRetry'

describe('withRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should resolve if the promise succeeds at first try', async () => {
    // create a mock function that returns a resolved promise
    const mockFn = vi.fn().mockResolvedValue('success')

    const getDataWithRetry = withRetry(mockFn)
    const result = await getDataWithRetry()
    expect(result).toBe('success')
    // check that the mock was called once
    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should resolve if the promise succeeds after some retries', async () => {
    // create a mock function that returns a rejected promise at first two tries
    // and a resolved promise at the third try
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')
    const getDataWithRetry = withRetry(mockFn)
    const result = await getDataWithRetry()
    expect(result).toBe('success')
    // check that the mock was called three times
    expect(mockFn).toHaveBeenCalledTimes(3)
  })

  it('should reject if the promise fails after all retries', async () => {
    // create a mock function that returns a rejected promise always
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'))
    const getDataWithRetry = withRetry(mockFn)
    await expect(getDataWithRetry()).rejects.toThrow('fail')
    // check that the mock was called four times (initial + retries)
    expect(mockFn).toHaveBeenCalledTimes(4)
  })

  it('should reject if the promise fails after four retries', async () => {
    // create a mock function that returns a rejected promise always
    const mockFn = vi.fn().mockRejectedValue(new Error('fail'))
    const getDataWithRetry = withRetry(mockFn, 4)
    await expect(getDataWithRetry()).rejects.toThrow('fail')
    // check that the mock was called four times (initial + retries)
    expect(mockFn).toHaveBeenCalledTimes(5)
  })
})

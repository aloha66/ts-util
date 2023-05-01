export const SUCCESS = 'success'
export const FAIL = 'fail'
export const TIMEOUT = 'Timeout'

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(SUCCESS)
    }, ms)
  })
}

export async function returnSuccessPromise(ms = 0) {
  await sleep(ms)
  return SUCCESS
}

export async function returnFailPromise(ms = 0, message = FAIL) {
  await sleep(ms)
  throw new Error(message)
}

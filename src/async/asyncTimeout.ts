export function asyncTimeout(ms = 5000) {
  return <T>(promise: Promise<T>) => Promise.race([promise, new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('Timeout')), ms))])
}

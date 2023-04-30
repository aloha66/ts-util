// a function that returns a promise and a control function
const stoppable = <T>(promise: Promise<T>) => {
    // a flag to indicate whether the promise is stopped
    let stopped = false
  
    // a function to stop or resume the promise
    const toggle = () => {
      stopped = !stopped
    }
  
    // a wrapper promise that checks the flag
    const wrapper = new Promise<T>((resolve, reject) => {
      promise.then(
        (value) => {
          // if not stopped, resolve the value
          if (!stopped) {
            resolve(value)
          }
        },
        (error) => {
          // if not stopped, reject the error
          if (!stopped) {
            reject(error)
          }
        }
      )
    })
  
    // return the wrapper promise and the control function
    return [wrapper, toggle]
  }
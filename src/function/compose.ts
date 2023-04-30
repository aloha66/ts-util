// export function compose<T extends any[], R>(
//   f: NewType<T, R>,
//   ...funcs: Array<NewType<T, R>>
// ): NewType<T, R> {
//   return funcs.reduce((prevFn, nextFn) => async (...args) => nextFn(await prevFn(...args)), f)
// }

// // compose函数组合
// export function compose<T extends any[], R>(...fns: Array<(arg: NewType<T, R>) => NewType<T, R>>): (arg: NewType<T, R>) => NewType<T, R> {
//   return function (arg: NewType<T, R>) {
//     return fns.reduceRight((composed, f) => f(composed), arg)
//   }
// }

type Func<T extends any[], R> = (...a: T) => R

/**
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for the
 * resulting composite function.
 *
 * @param funcs The functions to compose.
 * @returns A function obtained by composing the argument functions from right
 *   to left. For example, `compose(f, g, h)` is identical to doing
 *   `(...args) => f(g(h(...args)))`.
 */
export function compose(): <R>(a: R) => R

export function compose<F extends Function>(f: F): F

/* two functions */
export function compose<A, T extends any[], R>(
  f1: (a: A) => R,
  f2: Func<T, A>
): Func<T, R>

/* three functions */
export function compose<A, B, T extends any[], R>(
  f1: (b: B) => R,
  f2: (a: A) => B,
  f3: Func<T, A>
): Func<T, R>

/* four functions */
export function compose<A, B, C, T extends any[], R>(
  f1: (c: C) => R,
  f2: (b: B) => C,
  f3: (a: A) => B,
  f4: Func<T, A>
): Func<T, R>

/* rest */
export function compose<R>(
  f1: (a: any) => R,
  ...funcs: Function[]
): (...args: any[]) => R

export function compose<R>(...funcs: Function[]): (...args: any[]) => R

export function compose(...funcs: Function[]) {
  if (funcs.length === 0) {
    // infer the argument type so it is usable in inference down the line
    return <T>(arg: T) => arg
  }

  if (funcs.length === 1)
    return funcs[0]

  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args)),
  )
}

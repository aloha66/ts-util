/**
 * 状态机
 * 存储状态和状态变更的函数操作
 * 注册和派发事件
 */

type StateTransferFunction = (...args: unknown[]) => void

/**
 * S 状态
 * A Action
 */
export default class StateMachine<S extends number, A extends number> {
  s: S
  /**
    * 状态对照表
    */
  table: Map<S, Map<A, [StateTransferFunction, S]>>

  constructor(initState: S) {
    this.s = initState
    this.table = new Map()
  }

  /**
   * 注册状态
   * @param from 从状态
   * @param to 到状态
   * @param action 触发的行为
   * @param fn 执行逻辑
   */
  register(from: S, to: S, action: A, fn: StateTransferFunction) {
    if (!this.table.has(from))
      this.table.set(from, new Map())
    const adjTable = this.table.get(from)!
    adjTable.set(action, [fn, to])
  }

  /**
   * 派发
   * @param action 行为
   * @param data 参数
   * @returns
   */
  async dispatch(action: A, ...data: unknown[]) {
    // 当前状态下的对应关系
    const adjTable = this.table.get(this.s)
    if (!adjTable)
      return false

    if (!adjTable.has(action))
      return false

    const [fn, to] = adjTable.get(action)!
    await fn(...data)
    this.s = to

    // action复位到auto
    while (await this.dispatch(0 as A, ...data));

    return true
  }
}

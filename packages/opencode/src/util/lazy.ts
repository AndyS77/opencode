export function lazy<T>(fn: () => T) {
  let memo: { value: T } | undefined

  const result = (): T => {
    if (memo) return memo.value
    memo = { value: fn() }
    return memo.value
  }

  result.reset = () => {
    memo = undefined
  }

  result.loaded = () => memo !== undefined

  return result
}

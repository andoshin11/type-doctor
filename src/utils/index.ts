export * from './code2symptoms'
export * from './diagnostic'
export * from './printer'

export function nonNullable<T>(arg: T): arg is NonNullable<T> {
  return arg !== undefined || arg !== null
}

export function mutable<T>(arg: readonly T[]): T[] {
  return [...arg]
}

export function flatten<T>(data: T[][]): T[] {
  return data.reduce((acc, ac) => [...acc, ...ac], [] as T[])
}

// filter items of a which does not exist in b
export function diff<T>(a: T[], b: T[]): T[] {
  return a.filter(item => !b.includes(item))
}

export const pluck = <T extends object, K extends keyof T>(data: T[], key: K): T[K][] => data.map(item => item[key])

export const uniqBy = <T extends object>(arr: T[], key: keyof T) => {
  const propList = pluck(arr, key)
  return arr.filter((elm, i, self) => propList.indexOf(elm[key]) === i)
}

export * from './code2symptoms'
export * from './diagnostic'

export function nonNullable<T>(arg: T): arg is NonNullable<T> {
  return arg !== undefined || arg !== null
}

export function mutable<T>(arg: readonly T[]): T[] {
  return [...arg]
}

export function flatten<T>(data: T[][]): T[] {
  return data.reduce((acc, ac) => [...acc, ...ac], [] as T[])
}

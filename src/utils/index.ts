export * from './diagnostic'

export function nonNullable<T>(arg: T): arg is NonNullable<T> {
  return arg !== undefined || arg !== null
}

export function flatten<T>(data: T[][]): T[] {
  return data.reduce((acc, ac) => [...acc, ...ac], [] as T[])
}

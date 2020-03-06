import { code2symptomDict } from '../const'

/**
 * Convert TS diagnostic code to inner symptoms type
 */

export const code2symptom = (code: number) => {
  const result = code2symptomDict[code]

  return !!result ? result : undefined
}

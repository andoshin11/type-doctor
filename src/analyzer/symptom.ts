import * as ts from 'typescript'
import { SymptomType } from './types'

export const getSymptomType = (diagnostic: ts.Diagnostic) => {
  const message = typeof diagnostic.messageText === 'string' ? diagnostic.messageText : diagnostic.messageText.messageText

  // Check Assignablity
  const isNotAssignableError = /is not assignable to/.test(message)
  if (isNotAssignableError) {
    return SymptomType.NOT_ASSIGNABLE
  }

  return SymptomType.UNKNOWN
}

import * as ts from 'typescript'
import { code2symptom } from '../utils'

export class Analyzer {
  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    diagnostics.forEach(this.analyzeDiagnostic)
  }

  analyzeDiagnostic(diagnostic: ts.Diagnostic) {
    console.log(diagnostic.code)
    const symptom = code2symptom(diagnostic.code)

    console.log(symptom)
  }
}

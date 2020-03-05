import * as ts from 'typescript'
import { getSymptomType } from './symptom'

export class Analyzer {
  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    diagnostics.forEach(this.analyzeDiagnostic)
  }

  analyzeDiagnostic(diagnostic: ts.Diagnostic) {
    const symptomType = getSymptomType(diagnostic)
    console.log('symptomType')
    console.log(symptomType)
  }
}

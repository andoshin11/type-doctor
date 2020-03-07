import * as ts from 'typescript'
import { prompt } from 'enquirer'
import { Doctor } from '../../../doctor'

const autoFix = async (doctor: Doctor, diagnostics: ts.Diagnostic[]) => {
  const autoCodeFixes = doctor.getAutoCodeFixes(diagnostics)

  const { confirm } = await prompt<{ confirm: boolean }>({
    type: 'confirm',
    name: 'confirm',
    message: `Fix auto fixable errors? (found ${autoCodeFixes.length} items)`,
  })

  if (confirm) {
    doctor.applyAutoCodeFixActions()
  }
}

export default autoFix

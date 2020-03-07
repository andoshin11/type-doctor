import { Doctor } from '../../../doctor'
import runDiagnostics from './runDiagnostics'
import autoFix from './autoFix'

export const exec = async (doctor: Doctor) => {

  // 1. Initial diagnostics
  const { diagnostics } = runDiagnostics(doctor)

  // 2. Fix auto fiable errors
  await autoFix(doctor, diagnostics)
}

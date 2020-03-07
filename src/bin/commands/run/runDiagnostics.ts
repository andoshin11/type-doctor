import { Spinner } from 'clui'
import { Doctor } from '../../../doctor'
import { fileNumWithUnit } from './helper'

const runDiagnostics = (doctor: Doctor) => {
  // Prepare
  const spinner = new Spinner(`Running diagnostics on ${fileNumWithUnit(doctor.fileNames)}...`)
  spinner.start()

  // Body
  const { diagnostics } = doctor.runDiagnostics()

  // Close
  spinner.stop()

  return {
    diagnostics
  }
}

export default runDiagnostics

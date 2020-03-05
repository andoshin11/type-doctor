import * as commander from 'commander'
import * as path from 'path'
import * as fs from 'fs'
import { Doctor } from '../doctor'
import { flatten } from '../utils'

const pkg = require('../../package.json')

commander
  .version(pkg.version)
  .command('run')
  .action(async () => {
    try {
      const currentDir = process.cwd()
      const configPath = path.resolve(currentDir, 'tsconfig.json')
      if (!fs.existsSync(configPath)) {
        throw new Error(`could not find tsconfig.json at: ${currentDir}`)
      }

      const doctor = Doctor.fromConfigFile(configPath)
      // const diagnostics = doctor.getSemanticDiagnostics()
      const diagnostics = doctor.runDiagnostics()
      doctor.analyzeDiagnostics(flatten(Object.values(diagnostics)))
    
    } catch (e) {
      throw e
    }
  })

commander.parse(process.argv)

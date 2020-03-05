import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { createHost, createService } from './langSvc'

export class Doctor {
  service: ts.LanguageService

  constructor(private fileNames: string[], private compilerOptions: ts.CompilerOptions) {
    const host = createHost(fileNames, compilerOptions)
    this.service = createService(host)
  }

  static fromConfigFile(configPath: string): Doctor {
    const content = fs.readFileSync(configPath).toString();
    const parsed = ts.parseJsonConfigFileContent(
        JSON.parse(content),
        ts.sys,
        path.dirname(configPath)
    );
    return new Doctor(parsed.fileNames, parsed.options)
  }

  getSemanticDiagnostics(): { [fileName: string]: ts.Diagnostic[] } {
    const { fileNames, service } = this
    const result = fileNames.reduce((acc, ac) => {
      acc[ac] = service.getSemanticDiagnostics(ac)
      return acc
    }, {} as { [fileName: string]: ts.Diagnostic[] })
    return result
  }
}

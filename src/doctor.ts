import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { createHost, createService } from './langSvc'
import { Reporter } from './reporter'
import { Analyzer } from './analyzer'

export class Doctor {
  private service: ts.LanguageService
  private reporter: Reporter
  private analyzer: Analyzer

  constructor(private fileNames: string[], private compilerOptions: ts.CompilerOptions) {
    const host = createHost(fileNames, compilerOptions)
    this.service = createService(host)
    this.reporter = new Reporter()
    this.analyzer = new Analyzer()
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

  runDiagnostics() {
    const diagnostics = this.getSemanticDiagnostics()
    this.reporter.reportErrors(diagnostics)
    return diagnostics
  }

  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    this.analyzer.analyzeDiagnostics(diagnostics)
  }
}

import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { createHost, createService } from './langSvc'
import { Reporter } from './reporter'
import { Analyzer } from './analyzer'
import { flatten, nonNullable, mutable } from './utils'

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

  getSemanticDiagnostics() {
    const { fileNames, service } = this
    const result = fileNames.reduce((acc, ac) => {
      acc = [...acc, ...service.getSemanticDiagnostics(ac)]
      return acc
    }, [] as ts.Diagnostic[])
    return result
  }

  getCodeFixes(diagnostic: ts.Diagnostic) {
    const { start, length, file, code } = diagnostic
    if (typeof start !== 'number' || !length || !file) return undefined
    return this.service.getCodeFixesAtPosition(file.fileName, start, start + length, [code], {}, {})
  }

  runDiagnostics() {
    const diagnostics = this.getSemanticDiagnostics()
    const codeFixesList = diagnostics.map(this.getCodeFixes.bind(this)).filter(nonNullable).map(mutable)
    const codeFixes = flatten(codeFixesList)

    this.reporter.reportDiagnostics(diagnostics)
    this.reporter.reportDiagnosticsSummary(diagnostics, codeFixes)
    return diagnostics
  }

  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    this.analyzer.analyzeDiagnostics(diagnostics)
  }
}

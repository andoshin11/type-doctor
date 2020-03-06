import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { createHost, createService } from './langSvc'
import { Reporter } from './reporter'
import { Analyzer } from './analyzer'
import { flatten, hasDiagRange } from './utils'
import { CodeFixAction } from './types'

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

  getCodeFixes(diagnostic: ts.Diagnostic): CodeFixAction[] {
    const { file, code } = diagnostic
    if (!hasDiagRange(diagnostic) || !file) return []

    const codeFixes = this.service.getCodeFixesAtPosition(file.fileName, diagnostic.start, diagnostic.start + diagnostic.length, [code], {}, {})

    return [...codeFixes]
  }

  runDiagnostics() {
    const diagnostics = this.getSemanticDiagnostics()
    const codeFixesList = diagnostics.map(this.getCodeFixes.bind(this))
    const codeFixes = flatten(codeFixesList)

    this.reporter.reportDiagnostics(diagnostics)
    this.reporter.reportDiagnosticsSummary(diagnostics, codeFixes)

    console.log(JSON.stringify(codeFixes, null, '\t'))

    return {
      diagnostics,
      codeFixes
    }
  }

  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    this.analyzer.analyzeDiagnostics(diagnostics)
  }
}

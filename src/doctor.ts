import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { createHost, createService } from './langSvc'
import { Reporter } from './reporter'
import { Analyzer } from './analyzer'
import { Surgeon } from './surgeon'
import { flatten, hasDiagRange, printList } from './utils'
import { CodeFixAction } from './types'

export class Doctor {
  private service: ts.LanguageService
  private reporter: Reporter
  private analyzer: Analyzer
  private surgeon: Surgeon

  constructor(private fileNames: string[], private compilerOptions: ts.CompilerOptions, private debug: boolean = false) {
    const host = createHost(fileNames, compilerOptions)
    this.service = createService(host)
    this.reporter = new Reporter()
    this.analyzer = new Analyzer()
    this.surgeon = new Surgeon(fileNames, this.reporter, this.service)
  }

  static fromConfigFile(configPath: string, debug: boolean = false): Doctor {
    const content = fs.readFileSync(configPath).toString();
    const parsed = ts.parseJsonConfigFileContent(
        JSON.parse(content),
        ts.sys,
        path.dirname(configPath)
    );
    return new Doctor(parsed.fileNames, parsed.options, debug)
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

    /**
     * Notice:
     *
     * type-doctor accepts only one code change at a time for a file
     * due to the character position dependent architecture.
     */
    function transform(codeFixes: ts.CodeFixAction): CodeFixAction {
      const { fixName, description, changes } = codeFixes
      const representChange = changes[0].textChanges[0]

      return {
        fileName: file!.fileName,
        fixName,
        description,
        textChange: {
          span: representChange.span,
          newText: representChange.newText
        }
      }
    }

    return [...codeFixes].map(transform)
  }

  runDiagnostics() {
    const diagnostics = this.getSemanticDiagnostics()
    const codeFixesList = diagnostics.map(this.getCodeFixes.bind(this))
    const codeFixes = flatten(codeFixesList)

    this.reporter.reportDiagnostics(diagnostics)
    this.reporter.reportDiagnosticsSummary(diagnostics, codeFixes)

    // console.log(JSON.stringify(codeFixes, null, '\t'))

    return {
      diagnostics,
      codeFixes
    }
  }

  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    // TODO
    // this.analyzer.analyzeDiagnostics(diagnostics)
  }

  applyCodeFixActions(actions: CodeFixAction[]) {
    const updatedSourceFiles = this.surgeon.applyCodeFixActions(actions)
    if (this.debug) {
      updatedSourceFiles.forEach(s => {
        console.log(s.getFullText())
      })
    } else {
      // overrite file
    }
  }
}

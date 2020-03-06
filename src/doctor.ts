import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import * as chalk from 'chalk'
import { createHost, createService } from './langSvc'
import { Reporter } from './reporter'
import { Analyzer } from './analyzer'
import { Surgeon } from './surgeon'
import { flatten, hasDiagRange } from './utils'
import { CodeFixAction, FileEntry } from './types'

export class Doctor {
  private service: ts.LanguageService
  private reporter: Reporter
  private analyzer: Analyzer
  private surgeon: Surgeon

  scriptVersions: FileEntry = new Map()

  constructor(private fileNames: string[], private compilerOptions: ts.CompilerOptions, private debug: boolean = false) {
    const host = createHost(fileNames, compilerOptions, this.scriptVersions)
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

  // set virtual file
  updateVirtualFile(sourceFile: ts.SourceFile) {
    const { fileName } = sourceFile
    const scriptSnapshot = ts.ScriptSnapshot.fromString(sourceFile.getFullText())
    const currentScriptVersion = this.scriptVersions.get(fileName)!.version
    this.scriptVersions.set(fileName, { version: currentScriptVersion + 1, scriptSnapshot })
  }

  analyzeDiagnostics(diagnostics: ts.Diagnostic[]) {
    // TODO
    // this.analyzer.analyzeDiagnostics(diagnostics)
  }

  applyCodeFixActions(actions: CodeFixAction[], silent: boolean = false) {
    const { updatedSourceFiles } = this.surgeon.applyCodeFixActions(actions)
    if (!silent) {
      const unit = updatedSourceFiles.length > 1 ? 'files' : 'file'
      this.reporter.report(`✨ Fixed ${chalk.blue(updatedSourceFiles.length)} ${unit} ✨`)
    }

    if (this.debug) {
      updatedSourceFiles.forEach(s => {
        console.log(s.getFullText())
      })
    } else {
      // overrite file
    }
  }

  /**
   * Warning: cpu heavy
   *
   * apply all code fixes until no item's available
   */
  applyAllCodeFixActions() {
    const getSemanticDiagnostics = this.getSemanticDiagnostics.bind(this)
    const getCodeFixes = this.getCodeFixes.bind(this)
    const surgeon = this.surgeon
    const updateVirtualFile = this.updateVirtualFile.bind(this)
    const writeFile = this.writeFile.bind(this)

    function run() {
      const diagnostics = getSemanticDiagnostics()
      const codeFixes = flatten(diagnostics.map(getCodeFixes))
      if (!codeFixes.length) return
      const { updatedSourceFiles } = surgeon.applyCodeFixActions(codeFixes)
      updatedSourceFiles.forEach(updateVirtualFile)
      run()
    }

    run()

    // check updated files
    const scriptVersions = this.scriptVersions
    const updatedFiles = Array.from(scriptVersions.keys())
      .filter(key => scriptVersions.get(key)!.version >= 1)

    // emit
    updatedFiles.forEach(fileName => {
      const scriptSnapshot = scriptVersions.get(fileName)!.scriptSnapshot
      const content = scriptSnapshot.getText(0, scriptSnapshot.getLength())
      writeFile(fileName, content)
    })

    const unit = updatedFiles.length > 1 ? 'files' : 'file'
    this.reporter.report(`✨ Fixed ${chalk.blue(updatedFiles.length)} ${unit} ✨`)
  }

  writeFile(fileName: string, content: string) {
    fs.writeFileSync(fileName, content)
  }
}

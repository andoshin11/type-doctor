import * as ts from 'typescript'

const createConfigFileHost = (): ts.ParseConfigFileHost => ({
  useCaseSensitiveFileNames: false,
  readDirectory: ts.sys.readDirectory,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  onUnRecoverableConfigFileDiagnostic(diagnostic: ts.Diagnostic) {
    throw new Error(
      ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    )
  }
})

export function createProgram(searchPath: string) {
  const configPath = ts.findConfigFile(
    searchPath,
    ts.sys.fileExists,
    'tsconfig.json'
  )
  if (!configPath) {
    throw new Error("could not find 'tsconfig.json'")
  }
  const parsedCommandLine = ts.getParsedCommandLineOfConfigFile(
    configPath,
    {},
    createConfigFileHost()
  )
  if (!parsedCommandLine || parsedCommandLine.errors.length) {
    throw new Error('could not parse config file correctly')
  }
  return ts.createProgram({
    rootNames: parsedCommandLine.fileNames,
    options: parsedCommandLine.options
  })
}

import * as ts from 'typescript'
import * as fs from 'fs'

export const createHost = (fileNames: string[], compilerOptions: ts.CompilerOptions): ts.LanguageServiceHost => {
  return {
    getScriptFileNames: () => fileNames,
    getScriptVersion: _ => '0',
    getScriptSnapshot: fileName => {
      if (!fs.existsSync(fileName)) {
        return undefined
      }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString())
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    resolveModuleNames: (moduleNames, containingFile) => {
      const resolutionHost = { fileExists: ts.sys.fileExists, readFile: ts.sys.readFile };
      const ret = [] as ts.ResolvedModule[];
      moduleNames.forEach(name => {
          const resolved = ts.resolveModuleName(
              name,
              containingFile,
              compilerOptions,
              resolutionHost
          ).resolvedModule;
          if (resolved !== undefined) {
              ret.push(resolved);
          }
      });
      return ret;
  }
  }
}

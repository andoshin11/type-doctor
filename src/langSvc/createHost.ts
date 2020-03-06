import * as ts from 'typescript'
import * as fs from 'fs'
import { FileEntry } from '../types'

export const createHost = (fileNames: string[], compilerOptions: ts.CompilerOptions, fileEntry: FileEntry): ts.LanguageServiceHost => {
  const getCurrentVersion = (fileName: string) => fileEntry.has(fileName) ? fileEntry.get(fileName)!.version : 0

  return {
    getScriptFileNames: () => fileNames,
    getScriptVersion: fileName => getCurrentVersion(fileName) + '',
    getScriptSnapshot: fileName => {
      if (!fs.existsSync(fileName)) {
        return undefined
      }

      if (fileEntry.has(fileName)) {
        return fileEntry.get(fileName)!.scriptSnapshot
      } else {
        const content = fs.readFileSync(fileName).toString()
        const scriptSnapshot = ts.ScriptSnapshot.fromString(content)
        fileEntry.set(fileName, { version: 0, scriptSnapshot })
        return scriptSnapshot
      }
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

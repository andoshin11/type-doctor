import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { FileEntry } from '../types'

export const createHost = (fileNames: string[], compilerOptions: ts.CompilerOptions, fileEntry: FileEntry): ts.LanguageServiceHost => {
  const getCurrentVersion = (fileName: string) => fileEntry.has(fileName) ? fileEntry.get(fileName)!.version : 0
  const getTextFromSnapshot = (snapshot: ts.IScriptSnapshot) => snapshot.getText(0, snapshot.getLength())

  const readFile = (fileName: string, encoding: string | undefined = 'utf8') => {
    fileName = path.normalize(fileName);
    try {
      return fs.readFileSync(fileName, encoding);
    } catch (e) {
      return undefined;
    }
  }

  const readFileWithFallback = (
    filePath: string,
    encoding?: string | undefined
  ) => ts.sys.readFile(filePath, encoding) || readFile(filePath, encoding);

  const moduleResolutionHost: ts.ModuleResolutionHost = {
    fileExists: fileName => {
      return ts.sys.fileExists(fileName) || readFile(fileName) !== undefined
    },
    readFile: fileName => {
      if (fileEntry.has(fileName)) {
        const snapshot = fileEntry.get(fileName)!.scriptSnapshot
        return getTextFromSnapshot(snapshot)
      }
      readFileWithFallback
    },
    realpath: ts.sys.realpath,
    directoryExists: ts.sys.directoryExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getDirectories: ts.sys.getDirectories
  }

  const host: ts.LanguageServiceHost = {
    getScriptFileNames: () => fileNames,
    getScriptVersion: fileName => getCurrentVersion(fileName) + '',
    getScriptSnapshot: fileName => {
      if (fileEntry.has(fileName)) {
        return fileEntry.get(fileName)!.scriptSnapshot
      } else {
        if (!fs.existsSync(fileName)) {
          return undefined
        }
        const content = fs.readFileSync(fileName).toString()
        const scriptSnapshot = ts.ScriptSnapshot.fromString(content)
        fileEntry.set(fileName, { version: 0, scriptSnapshot })
        return scriptSnapshot
      }
    },
    getCurrentDirectory: () => process.cwd(),
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: options => ts.getDefaultLibFilePath(options),
    resolveModuleNames: (moduleNames, containingFile, _, __, options) => {
      const ret: (ts.ResolvedModule | undefined)[] = moduleNames.map(name => {
          if (/\.vue$/.test(name)) {
            const resolved: ts.ResolvedModule = {
              resolvedFileName: normalize(path.resolve(path.dirname(containingFile), name))
            }
            return resolved
          }

          const { resolvedModule } = ts.resolveModuleName(
              name,
              containingFile,
              options,
              moduleResolutionHost
          );
          return resolvedModule
      });
      return ret;
    },
    fileExists: moduleResolutionHost.fileExists,
    readFile: moduleResolutionHost.readFile,
    readDirectory: ts.sys.readDirectory,
    getDirectories: ts.sys.getDirectories,
    realpath: moduleResolutionHost.realpath
  }

  return host
}

// .ts suffix is needed since the compiler skips compile
// if the file name seems to be not supported types
function normalize (fileName: string): string {
  if (/\.vue$/.test(fileName)) {
    return fileName + '.ts'
  }
  return fileName
}

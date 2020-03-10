import * as ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
import { FileEntry } from '../types'

export const createHost = (fileNames: string[], compilerOptions: ts.CompilerOptions, fileEntry: FileEntry): ts.LanguageServiceHost => {
  const getCurrentVersion = (fileName: string) => fileEntry.has(fileName) ? fileEntry.get(fileName)!.version : 0

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
    readFile: readFileWithFallback,
    realpath: ts.sys.realpath,
    directoryExists: ts.sys.directoryExists,
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getDirectories: ts.sys.getDirectories
  }

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
          if (/\.vue$/.test(name)) {
            const resolved = {
              resolvedFileName: normalize(path.resolve(path.dirname(containingFile), name)),
              extension: ts.Extension.Ts
            }
            ret.push(resolved)
          }

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
    },
    fileExists: moduleResolutionHost.fileExists,
    readFile: moduleResolutionHost.readFile,
    readDirectory: ts.sys.readDirectory,
    getDirectories: ts.sys.getDirectories,
    realpath: moduleResolutionHost.realpath
  }
}

// .ts suffix is needed since the compiler skips compile
// if the file name seems to be not supported types
function normalize (fileName: string): string {
  if (/\.vue$/.test(fileName)) {
    return fileName + '.ts'
  }
  return fileName
}

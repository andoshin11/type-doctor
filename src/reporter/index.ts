import * as ts from 'typescript'
import * as chalk from 'chalk'
import { pos2location } from '../utils'

const toRelativePath = (str: string) => str.replace(process.cwd() + '/', '')

const pad = (letter: string, length: number) => {
  const outs: string[] = [];
  for (let i = 0; i < length; i++) {
    outs.push(letter);
  }
  return outs.join('');
}

const lineMark = (line: number, width: number) => {
  const strLine = line + 1 + '';
  return chalk.inverse(pad(' ', width - strLine.length) + strLine) + ' '
};

const lineMarkForUnderline = (width: number) => {
  return chalk.inverse(pad(' ', width)) + ' ';
};

export class Reporter {
  report(msg: any) {
    console.log(msg)
  }

  reportError(fileName: string, errors: ts.Diagnostic[]) {
    if (!errors.length) return
    const relativeFileName = toRelativePath(fileName)

    errors.forEach(err => {
      const hasLocation = typeof err.start === 'number' && typeof err.length === 'number'
      if (hasLocation) {
        this._reportErrorWithLoc(relativeFileName, err)
        // console.log(err)
      } else {
        console.log(err)
      }
    })
  }

  _reportErrorWithLoc(relativeFileName: string, error: ts.Diagnostic) {
    const { start, length, file, messageText } = error
    if (!start || !length) return
    const content = file && file.getFullText()
    if (!content) return

    const startLC = pos2location(content, start)
    const endLC = pos2location(content, start + length)
    const fileIndicator = `${relativeFileName}:${startLC.line + 1}:${startLC.character + 1}`
    const message = typeof messageText === 'string' ? messageText : messageText.messageText
    const outputs = [`${fileIndicator} - ${message}`, '']
    const allLines = content.split('\n');
    const preLines = allLines.slice(Math.max(startLC.line - 1, 0), startLC.line);
    const lines = allLines.slice(startLC.line, endLC.line + 1);
    const postLines = allLines.slice(endLC.line + 1, Math.min(allLines.length - 1, endLC.line + 2));
    const lineMarkerWidth = (Math.min(allLines.length - 1, endLC.line + 2) + '').length;
    for (let i = 0; i < preLines.length; ++i) {
      outputs.push(lineMark(i + startLC.line - 1, lineMarkerWidth) + chalk.reset(preLines[i]));
    }
    for (let i = 0; i < lines.length; ++i) {
      outputs.push(lineMark(i + startLC.line, lineMarkerWidth) + lines[i]);
      if (i === 0) {
        if (startLC.line === endLC.line) {
          outputs.push(
            lineMarkForUnderline(lineMarkerWidth) +
              pad(' ', startLC.character) +
              chalk.red(pad('~', endLC.character - startLC.character)),
          );
        } else {
          outputs.push(
            lineMarkForUnderline(lineMarkerWidth) +
              pad(' ', startLC.character) +
              chalk.red(pad('~', lines[i].length - startLC.character)),
          );
        }
      } else if (i === lines.length - 1) {
        outputs.push(lineMarkForUnderline(lineMarkerWidth) + chalk.red(pad('~', endLC.character)));
      } else {
        outputs.push(lineMarkForUnderline(lineMarkerWidth) + chalk.red(pad('~', lines[i].length)));
      }
    }

    for (let i = 0; i < postLines.length; ++i) {
      outputs.push(lineMark(i + endLC.line + 1, lineMarkerWidth) + chalk.reset(postLines[i]));
    }
    outputs.push('');

    this.report(outputs.join('\n'))
  }

  reportErrors(errors: { [fileName: string]: ts.Diagnostic[] }) {
    // this._reportErrorSummary(errors)
    Object.entries(errors).forEach(([key, val]) => {
      this.reportError(key, val)
    })
  }

  _reportErrorSummary(errors: ts.Diagnostic[]) {
    const summary: { [category in ts.DiagnosticCategory]: number } = {
      [ts.DiagnosticCategory.Warning]: 0,
      [ts.DiagnosticCategory.Error]: 0,
      [ts.DiagnosticCategory.Suggestion]: 0,
      [ts.DiagnosticCategory.Message]: 0,
    }

    errors.forEach(err => summary[err.category]++)

  }
}

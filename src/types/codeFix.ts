interface TextSpan {
  start: number;
  length: number;
}

interface TextChange {
  span: TextSpan;
  newText: string;
}

interface FileTextChanges {
  fileName: string;
  textChanges: readonly TextChange[];
  isNewFile?: boolean;
}

export type CodeChangeType = FileTextChanges

export type CodeFixAction = {
  /** Short name to identify the fix, for use by telemetry. */
  fixName: string;
  /** Description of the code action to display */
  description: string;
  /** Text changes to apply to each file as part of the code action */
  changes: CodeChangeType[];
}

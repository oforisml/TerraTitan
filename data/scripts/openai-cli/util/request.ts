import fs from "fs";
import path from "path";
import { ConversionType, type ConversionRequestProps } from "./types";
import { cdktfBaseName } from "./helpers";
import { findGeneratedImports, filterGeneratedModule } from "../retrieval";

// path to data/ directory
const baseDir = `${__dirname}/../../..`;

export class ConversionRequest {
  constructor(public props: ConversionRequestProps) {}

  private _input: string | undefined = undefined;
  private _inputRef: string | undefined = undefined;
  private _outputRefs: string | undefined = undefined;
  private _expected: string | undefined = undefined;

  /**
   * Input file to convert
   */
  get input(): string {
    if (this._input) {
      return this._input;
    }
    this._input = fs.readFileSync(this.props.inputFile, "utf8");
    return this._input;
  }
  /**
   * Relative/resolved path to the input file
   */
  get inputFileName(): string {
    return path.relative(process.cwd(), this.props.inputFile);
  }
  /** Reference data for the AWSCDK Input */
  get inputRef(): string {
    if (this._inputRef) {
      return this._inputRef;
    }
    const contents: string[] = [];
    for (const inputRef of this.props.inputRefFiles) {
      const header = `// ${path.basename(inputRef)}\n`;
      const inputRefSource = fs.readFileSync(inputRef, "utf8");
      if (this.props.type === ConversionType.UNIT) {
        contents.push(header + inputRefSource); // no filtering on ref files for unit tests for now
      } else {
        contents.push(header + filterInputRefFile(this.input, inputRefSource));
      }
    }
    this._inputRef = contents.join("\n\n");
    return this._inputRef;
  }
  /** Reference data for the expected CDKTF Output */
  get outputRefs(): string {
    if (this._outputRefs) {
      return this._outputRefs;
    }
    this._outputRefs = this.props.outputRefFiles
      .map(
        (f) =>
          `// ${
            this.props.type === ConversionType.SOURCE
              ? cdktfBaseName(f)
              : path.basename(f)
          }\n` + fs.readFileSync(f, "utf8").replace(/^#/gm, "###")
      )
      .join("\n\n");
    return this._outputRefs;
  }
  get expected(): string | undefined {
    if (this._expected) {
      return this._expected;
    }
    this._expected = this.props.expectedFile
      ? fs.readFileSync(this.props.expectedFile, "utf8")
      : undefined;
    return this._expected;
  }
  /**
   * The file to write the output to
   */
  get responseFile(): string {
    return this.props.responseFile;
  }
}

/**
 * Process input to extract and filter relevant declarations from inputRef
 */
export function filterInputRefFile(
  inputSource: string,
  inputRefSource: string
): string {
  const importsByModule = findGeneratedImports(inputSource);

  // TODO: Validate the inputRefSource has all the necessary declarations

  // Collect all symbols from all generated imports
  const symbolsToFilter = Object.values(importsByModule).flatMap(
    (symbols) => symbols
  );

  // Filter the input reference file to only include relevant declarations
  const filteredDeclarations = filterGeneratedModule(
    inputRefSource,
    symbolsToFilter
  );

  return filteredDeclarations;
}

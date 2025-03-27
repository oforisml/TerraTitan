import fs from "fs";
import path from "path";
import { ConversionType, type ConversionExample } from "./types";
import { cdktfBaseName } from "./helpers";
import { ConversionRequest } from "./request";
import { findGeneratedImports, filterGeneratedModule } from "../retrieval";

// path to data/ directory
const baseDir = `${__dirname}/../../..`;

/**
 * Samples, relative to data/ folder
 */
const EXAMPLES: Record<string, ConversionExample> = {
  // TODO: Auto populate this from the sample folders?
  "aws-events/event-bus/src": {
    type: ConversionType.SOURCE,
    // Example AWS CDK TypeScript source code
    inputFile: `${baseDir}/samples/aws-events/event-bus/input/src/event-bus.ts`,
    inputRefFiles: [
      `${baseDir}/reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,
    ],

    // Example CDKTF Source code output
    outputFile: `${baseDir}/samples/aws-events/event-bus/output/src/event-bus.ts`,
    // created by running bun scripts/merge-docs/index.ts
    // CDKTF Declaration merged with terraform-provider-aws Markdown docs
    outputRefFiles: [
      `${baseDir}/reference/merged/provider-aws/cloudwatch-event-bus/index.d.ts`,
      `${baseDir}/reference/merged/provider-aws/cloudwatch-event-bus-policy/index.d.ts`,
      `${baseDir}/reference/merged/provider-aws/cloudwatch-event-permission/index.d.ts`,
    ],
  },
  "aws-events/event-bus/test": {
    type: ConversionType.UNIT,
    inputFile: `${baseDir}/samples/aws-events/event-bus/input/test/event-bus.test.ts`,
    inputRefFiles: [
      `${baseDir}/samples/aws-events/event-bus/input/declarations/event-bus.d.ts`,
    ],

    // Example CDKTF Source code output
    outputFile: `${baseDir}/samples/aws-events/event-bus/output/test/event-bus.test.ts`,
    // created by running bun scripts/merge-docs/index.ts
    // CDKTF Declaration merged with terraform-provider-aws Markdown docs
    outputRefFiles: [
      // Unit Tests use Terraform HCL Markdown docs as attributes reference
      `${baseDir}/reference/docs/provider-aws/r/cloudwatch_event_bus.html.markdown`,
      `${baseDir}/reference/docs/provider-aws/r/cloudwatch_event_bus_policy.html.markdown`,
      `${baseDir}/reference/docs/provider-aws/r/cloudwatch_event_permission.html.markdown`,
    ],
  },
  "aws-kinesis/stream/src": {
    type: ConversionType.SOURCE,
    inputFile: `${baseDir}/samples/aws-kinesis/stream/input/src/stream.ts`,
    inputRefFiles: [
      `${baseDir}/reference/declarations/aws-cdk-lib/aws-kinesis/lib/kinesis.generated.d.ts`,
    ],
    outputFile: `${baseDir}/samples/aws-kinesis/stream/output/src/kinesis-stream.ts`,
    outputRefFiles: [
      // created by running bun scripts/merge-docs/index.ts
      // CDKTF Declaration merged with terraform-provider-aws Markdown docs
      `${baseDir}/reference/merged/provider-aws/kinesis-stream/index.d.ts`,
    ],
  },
  "aws-kinesis/stream/test": {
    type: ConversionType.UNIT,
    inputFile: `${baseDir}/samples/aws-kinesis/stream/input/test/stream.test.ts`,
    inputRefFiles: [
      `${baseDir}/samples/aws-kinesis/stream/input/declarations/stream.d.ts`,
    ],
    outputFile: `${baseDir}/samples/aws-kinesis/stream/output/test/kinesis-stream.test.ts`,
    outputRefFiles: [
      // Unit Tests use Terraform HCL Markdown docs as attributes reference
      `${baseDir}/reference/docs/provider-aws/r/kinesis_stream.html.markdown`,
    ],
  },
};

export class Sample {
  public static fromName(name: string): Sample {
    const example = EXAMPLES[name];
    if (!example) {
      throw new Error(`Unknown example: ${name}`);
    }
    return new Sample(example);
  }

  private constructor(public example: ConversionExample) {}
  private _input: string | undefined = undefined;
  private _inputRefs: string | undefined = undefined;
  private _outputRefs: string | undefined = undefined;
  private _output: string | undefined = undefined;

  get input(): string {
    if (this._input) {
      return this._input;
    }
    this._input = fs.readFileSync(this.example.inputFile, "utf8");
    return this._input;
  }
  get output(): string {
    if (this._output) {
      return this._output;
    }
    this._output = fs.readFileSync(this.example.outputFile, "utf8");
    return this._output;
  }
  get inputRef(): string {
    if (this._inputRefs) {
      return this._inputRefs;
    }
    const contents: string[] = [];
    for (const inputRef of this.example.inputRefFiles) {
      const header = `// ${path.basename(inputRef)}\n`;
      const inputRefSource = fs.readFileSync(inputRef, "utf8");
      if (inputRef.endsWith("generated.d.ts")) {
        // filter generated code down to only relevant declarations
        contents.push(header + filterInputRefFile(this.input, inputRefSource));
      } else {
        contents.push(header + inputRefSource);
      }
    }
    this._inputRefs = contents.join("\n\n");
    return this._inputRefs;
  }
  get outputRefs(): string {
    if (this._outputRefs) {
      return this._outputRefs;
    }
    this._outputRefs = this.example.outputRefFiles
      .map(
        (f) =>
          `// ${
            this.example.type === ConversionType.SOURCE
              ? cdktfBaseName(f)
              : path.basename(f)
          }\n` + fs.readFileSync(f, "utf8").replace(/^#/gm, "###")
      )
      .join("\n\n");
    return this._outputRefs;
  }
  toSampleRequest(): ConversionRequest {
    return new ConversionRequest({
      type: this.example.type,
      inputFile: this.example.inputFile,
      inputRefFiles: this.example.inputRefFiles,
      outputRefFiles: this.example.outputRefFiles,
      responseFile: "responses/fake-response.md",
    });
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

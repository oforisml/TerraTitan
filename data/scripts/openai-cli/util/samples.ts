import fs from "fs";
import type { ConversionExample } from "./types";
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
    // Example AWS CDK TypeScript source code
    inputFile: `${baseDir}/samples/aws-events/event-bus/input/src/event-bus.ts`,
    // TODO: Filter down to just the relevant classes/interfaces?
    inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,

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
    inputFile: `${baseDir}/samples/aws-events/event-bus/input/test/event-bus.test.ts`,
    // TODO: Filter this down to just the relevant parts?
    inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,

    // Example CDKTF Source code output
    outputFile: `${baseDir}/samples/aws-events/event-bus/output/test/event-bus.test.ts`,
    // created by running bun scripts/merge-docs/index.ts
    // CDKTF Declaration merged with terraform-provider-aws Markdown docs
    outputRefFiles: [
      `${baseDir}/reference/merged/provider-aws/cloudwatch-event-bus/index.d.ts`,
      `${baseDir}/reference/merged/provider-aws/cloudwatch-event-bus-policy/index.d.ts`,
      `${baseDir}/reference/merged/provider-aws/cloudwatch-event-permission/index.d.ts`,
    ],
  },
  "aws-kinesis/stream/src": {
    inputFile: `${baseDir}/samples/aws-kinesis/stream/input/src/stream.ts`,
    inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-kinesis/lib/kinesis.generated.d.ts`,
    outputFile: `${baseDir}/samples/aws-kinesis/stream/output/src/kinesis-stream.ts`,
    outputRefFiles: [
      // created by running bun scripts/merge-docs/index.ts
      // CDKTF Declaration merged with terraform-provider-aws Markdown docs
      `${baseDir}/reference/merged/provider-aws/kinesis-stream/index.d.ts`,
    ],
  },
  "aws-kinesis/stream/test": {
    inputFile: `${baseDir}/samples/aws-kinesis/stream/input/test/stream.test.ts`,
    inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-kinesis/lib/kinesis.generated.d.ts`,
    outputFile: `${baseDir}/samples/aws-kinesis/stream/output/src/kinesis-stream.test.ts`,
    outputRefFiles: [
      // created by running bun scripts/merge-docs/index.ts
      // CDKTF Declaration merged with terraform-provider-aws Markdown docs
      `${baseDir}/reference/merged/provider-aws/kinesis-stream/index.d.ts`,
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
  private _inputRef: string | undefined = undefined;
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
    if (this._inputRef) {
      return this._inputRef;
    }
    const inputRefSource = fs.readFileSync(this.example.inputRefFile, "utf8");
    this._inputRef = filterInputRefFile(this.input, inputRefSource);
    return this._inputRef;
  }
  get outputRefs(): string {
    if (this._outputRefs) {
      return this._outputRefs;
    }
    this._outputRefs = this.example.outputRefFiles
      .map((f) => `// ${cdktfBaseName(f)}\n` + fs.readFileSync(f, "utf8"))
      .join("\n\n");
    return this._outputRefs;
  }
  toSampleRequest(): ConversionRequest {
    return new ConversionRequest({
      inputFile: this.example.inputFile,
      inputRefFile: this.example.inputRefFile,
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

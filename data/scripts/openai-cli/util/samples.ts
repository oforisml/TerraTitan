import fs from "fs";
import type { ConversionExample } from "./types";

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

  get input(): string {
    return fs.readFileSync(this.example.inputFile, "utf8");
  }
  get output(): string {
    return fs.readFileSync(this.example.outputFile, "utf8");
  }
  get inputRef(): string {
    return fs.readFileSync(this.example.inputRefFile, "utf8");
  }
  get outputRefs(): string {
    return this.example.outputRefFiles
      .map((f) => `// ${f}\n` + fs.readFileSync(f, "utf8"))
      .join("\n\n");
  }
}

import fs from "fs";
import { dtsBaseName } from "./helpers";
import { ConversionType } from "./types";
// path to data/ directory
const baseDir = `${__dirname}/../../..`;

export interface TerraConstructsReference {
  /**
   * References for the TerraConstructs core Declaration files
   */
  coreRefFiles: string[];
  /**
   * References for the TerraConstructs AWS Declaration files
   */
  awsRefFiles: string[];
  /**
   * Unit Test helpers
   */
  testHelpers: string[];
}

/**
 * TerraConstructs Reference files
 */
const refData: TerraConstructsReference = {
  coreRefFiles: [
    `${baseDir}/reference/declarations/terraconstructs/construct-base.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/duration.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/expiration.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/size.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/stack-base.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/terra-func.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/token.d.ts`,
  ],
  awsRefFiles: [
    `${baseDir}/reference/declarations/terraconstructs/aws/arn.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/aws/aws-construct.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/aws/aws-stack.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/aws/aws-tags.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/aws/log-retention.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/aws/provider-config.generated.d.ts`,
    `${baseDir}/reference/declarations/terraconstructs/aws/util.d.ts`,
  ],
  testHelpers: [
    `${baseDir}/reference/declarations/terraconstructs/test/assertions.d.ts`,
    `${baseDir}/reference/declarations/cdktf/testing/adapters/jest.d.ts`,
    `${baseDir}/reference/declarations/cdktf/testing/index.d.ts`,
  ],
};

/**
 * TerraConstructs Library
 */
export class LibRef {
  public static terraConstructs(type: ConversionType) {
    return new LibRef(refData, type);
  }

  private constructor(
    public readonly refData: TerraConstructsReference,
    private readonly type: ConversionType
  ) {}

  get core() {
    const pathPrefix =
      this.type === ConversionType.SOURCE ? "../../" : "../../../src";
    return this.refData.coreRefFiles
      .map(
        (f) => `${pathPrefix}/${dtsBaseName(f)}\n` + fs.readFileSync(f, "utf8")
      )
      .join("\n\n");
  }
  get aws() {
    const pathPrefix =
      this.type === ConversionType.SOURCE ? "../" : "../../../src/aws";
    return this.refData.awsRefFiles
      .map(
        (f) =>
          `// ${pathPrefix}/${dtsBaseName(f)}\n` + fs.readFileSync(f, "utf8")
      )
      .join("\n\n");
  }
  get testing() {
    return this.refData.testHelpers
      .map((f) => `// ../../${dtsBaseName(f)}\n` + fs.readFileSync(f, "utf8"))
      .join("\n\n");
  }
}

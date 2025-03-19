import fs from "fs";
import { dtsBaseName } from "./helpers";
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
};

/**
 * TerraConstructs Library
 */
export class LibRef {
  public static terraConstructs() {
    return new LibRef(refData);
  }
  private constructor(public readonly refData: TerraConstructsReference) {}

  get core() {
    return this.refData.coreRefFiles
      .map((f) => `// ../../${dtsBaseName(f)}\n` + fs.readFileSync(f, "utf8"))
      .join("\n\n");
  }
  get aws() {
    return this.refData.awsRefFiles
      .map((f) => `// ../${dtsBaseName(f)}\n` + fs.readFileSync(f, "utf8"))
      .join("\n\n");
  }
}

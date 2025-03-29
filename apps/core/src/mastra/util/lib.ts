import fs from 'fs';
import path from 'path';
import { gitRoot, dtsBaseName } from './helpers.js';
import { ConversionType } from './types.js';

export interface TerraConstructsReferences {
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

const declDir = path.join(gitRoot, 'data', 'reference', 'declarations');
const tcDir = path.join(declDir, 'terraconstructs');
const cdktfDir = path.join(declDir, 'cdktf');

/**
 * TerraConstructs Reference files
 */
const refData: TerraConstructsReferences = {
  coreRefFiles: [
    path.join(tcDir, 'construct-base.d.ts'),
    path.join(tcDir, 'duration.d.ts'),
    path.join(tcDir, 'expiration.d.ts'),
    path.join(tcDir, 'size.d.ts'),
    path.join(tcDir, 'stack-base.d.ts'),
    path.join(tcDir, 'terra-func.d.ts'),
    path.join(tcDir, 'token.d.ts'),
  ],
  awsRefFiles: [
    path.join(tcDir, 'aws', 'arn.d.ts'),
    path.join(tcDir, 'aws', 'aws-construct.d.ts'),
    path.join(tcDir, 'aws', 'aws-stack.d.ts'),
    path.join(tcDir, 'aws', 'aws-tags.d.ts'),
    path.join(tcDir, 'aws', 'log-retention.d.ts'),
    path.join(tcDir, 'aws', 'provider-config.generated.d.ts'),
    path.join(tcDir, 'aws', 'util.d.ts'),
  ],
  testHelpers: [
    path.join(tcDir, 'test', 'assertions.d.ts'),
    path.join(tcDir, 'test', 'test-resource.d.ts'),
    path.join(cdktfDir, 'testing', 'adapters', 'jest.d.ts'),
    path.join(cdktfDir, 'testing', 'index.d.ts'),
  ],
};

/**
 * Library references
 */
export class LibRef {
  public static terraConstructs(type: ConversionType) {
    return new LibRef(refData, type);
  }

  private constructor(
    public readonly refData: TerraConstructsReferences,
    private readonly type: ConversionType,
  ) {}

  get core() {
    const pathPrefix = this.type === ConversionType.SOURCE ? '../../' : '../../../src';
    return this.refData.coreRefFiles
      .map(f => `// ${pathPrefix}/${dtsBaseName(f)}\n` + fs.readFileSync(f, 'utf8'))
      .join('\n\n');
  }
  get aws() {
    const pathPrefix = this.type === ConversionType.SOURCE ? '../' : '../../../src/aws';
    return this.refData.awsRefFiles
      .map(f => `// ${pathPrefix}/${dtsBaseName(f)}\n` + fs.readFileSync(f, 'utf8'))
      .join('\n\n');
  }
  get testing() {
    return this.refData.testHelpers.map(f => `// ../../${dtsBaseName(f)}\n` + fs.readFileSync(f, 'utf8')).join('\n\n');
  }
}

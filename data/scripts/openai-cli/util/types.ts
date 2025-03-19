/**
 * A new Conversion Request
 */
export interface ConversionRequestProps {
  /**
   * The AWS CDK file to convert
   */
  inputFile: string;
  /**
   * References for the AWS CDK input file
   */
  inputRefFile: string;
  /**
   * References for the expected CDKTF output file
   */
  outputRefFiles: string[];
  /**
   * The file to write the output to
   */
  responseFile: string;

  /**
   * If this is a test, the expected output file
   */
  expectedFile?: string;
}

/**
 * A Conversion Example for few shot prompting
 */
export interface ConversionExample {
  /**
   * Example AWS CDK input file
   */
  inputFile: string;
  /**
   * References for the AWS CDK input file
   */
  inputRefFile: string;
  /**
   * Example CDKTF output file
   */
  outputFile: string;
  /**
   * References for the example CDKTF output file
   */
  outputRefFiles: string[];
}

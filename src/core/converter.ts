import { parseAwsCdkConstruct } from "./parser";
import { generateTerraformCdk } from "./generator";
import { validateConversion } from "./validator";
import { getVectorDbClient } from "../vectordb/client";
import { getAnthropicClient } from "../anthropic/client";
import {
  ConversionResult,
  AwsCdkConstruct,
  ConversionOptions,
  FileType,
} from "../types";
import { detectFileType } from "../utils/fileUtils";

/**
 * Convert an AWS CDK construct to Terraform CDK
 *
 * @param sourceFilePath Path to the AWS CDK construct file
 * @param options Conversion options
 * @returns The conversion result with Terraform CDK code
 */
export async function convertConstruct(
  sourceFilePath: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  // Parse the AWS CDK construct
  const parsedConstruct = await parseAwsCdkConstruct(sourceFilePath);

  // Override file type if specified in options
  if (options.fileType) {
    parsedConstruct.fileType = options.fileType;
  }

  // Initialize Anthropic client
  const anthropicClient = getAnthropicClient();

  // Initialize Vector DB client
  const vectorDbClient = getVectorDbClient();

  // Find similar patterns in vector database
  const similarPatterns = await vectorDbClient.findSimilarPatterns(
    parsedConstruct
  );

  // Generate Terraform CDK code using Anthropic
  const generatedCode = await generateTerraformCdk(
    parsedConstruct,
    similarPatterns,
    anthropicClient
  );

  // Validate the generated code
  const validationResult = await validateConversion(
    parsedConstruct,
    generatedCode
  );

  // Store the new pattern if validation passes and not a test file
  if (
    validationResult.success &&
    options.storePattern !== false &&
    parsedConstruct.fileType !== FileType.TEST
  ) {
    await vectorDbClient.storePattern(parsedConstruct, generatedCode);
  }

  return {
    originalConstruct: parsedConstruct,
    terraformCdkCode: generatedCode,
    validationResult,
    similarPatterns,
  };
}

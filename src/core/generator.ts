import { Anthropic } from "@anthropic-ai/sdk";
import { AwsCdkConstruct, FileType } from "../types";
import { generateWithClaude } from "../anthropic/client";

/**
 * Generate Terraform CDK code based on AWS CDK construct
 * @param parsedConstruct Parsed AWS CDK construct
 * @param similarPatterns Similar patterns from vector DB
 * @param anthropicClient Anthropic client instance
 * @returns Generated Terraform CDK code
 */
export async function generateTerraformCdk(
  parsedConstruct: AwsCdkConstruct,
  similarPatterns: any[] = [],
  anthropicClient: Anthropic
): Promise<string> {
  if (parsedConstruct.fileType === FileType.TEST) {
    return generateTestCode(parsedConstruct, similarPatterns, anthropicClient);
  } else {
    return generateSourceCode(
      parsedConstruct,
      similarPatterns,
      anthropicClient
    );
  }
}

async function generateSourceCode(
  parsedConstruct: AwsCdkConstruct,
  similarPatterns: any[] = [],
  anthropicClient: Anthropic
): Promise<string> {
  const prompt = `Convert this AWS CDK construct to Terraform CDK:

Source code:
\`\`\`typescript
${parsedConstruct.source}
\`\`\`

${
  similarPatterns.length > 0
    ? "Here are similar conversion patterns for reference:"
    : ""
}
${similarPatterns
  .map(
    (pattern) => `\`\`\`typescript\n${JSON.stringify(pattern, null, 2)}\n\`\`\``
  )
  .join("\n\n")}

Please convert the above AWS CDK construct to Terraform CDK (CDKTF) code.
Keep the same functionality but use Terraform CDK constructs and patterns.`;

  return await generateWithClaude(prompt, {
    system:
      "You are an expert in both AWS CDK and Terraform CDK. Convert the provided AWS CDK construct to Terraform CDK, preserving all functionality.",
  });
}

async function generateTestCode(
  parsedConstruct: AwsCdkConstruct,
  similarPatterns: any[] = [],
  anthropicClient: Anthropic
): Promise<string> {
  const prompt = `Convert this AWS CDK Jest test file to Terraform CDK:

Test code:
\`\`\`typescript
${parsedConstruct.source}
\`\`\`

${
  similarPatterns.length > 0
    ? "Here are similar conversion patterns for reference:"
    : ""
}
${similarPatterns
  .map(
    (pattern) => `\`\`\`typescript\n${JSON.stringify(pattern, null, 2)}\n\`\`\``
  )
  .join("\n\n")}

Please convert the above AWS CDK Jest tests to Terraform CDK (CDKTF) tests.
Keep the same test coverage and assertions but updated for Terraform CDK patterns.`;

  return await generateWithClaude(prompt, {
    system:
      "You are an expert in both AWS CDK and Terraform CDK testing. Convert the provided AWS CDK Jest tests to Terraform CDK tests, preserving all test coverage and assertions.",
  });
}

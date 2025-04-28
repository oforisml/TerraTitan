import path from 'node:path';
import { z } from 'zod';
import { batchRetrieveCdktfRefsOutputSchema } from './batch-cdktf-ref-rag.js';
import { findTestInputRefsOutputSchema } from './find-input-refs.js';
import { gitRoot } from '../../util/helpers.js';

const markdownHclAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'provider-aws');

// TODO: Use zod schemas in mastra/agents/unit-converter/index.ts
export const unitTestsConversionSchema = z.object({
  inputFile: z.string(),
  inputRefFiles: z.array(z.string()),
  outputRefFiles: z.array(z.string()),
  // outputPath: z.string().optional(),
});

export const batchConvertUnitTestsRequestsInputSchema = z.object({
  /**
   * All the input Unit Test Files to convert
   */
  testInputFiles: findTestInputRefsOutputSchema,
  /**
   * Re-use the CDKTF references from the source code conversion
   */
  batchRetrieveCdktfRefs: batchRetrieveCdktfRefsOutputSchema,
});

export const batchConvertUnitTestsRequestsOutputSchema = z.array(unitTestsConversionSchema);

// Example:
// unitTestConversions: [
//   {
//     inputFile: path.join(upstreamDir, moduleName, 'test', 'sns.test.ts'),
//     inputRefFiles: [
//       path.join(awsCdkSrcDir, moduleName, 'topic.d.ts'),
//       path.join(awsCdkSrcDir, moduleName, 'topic-base.d.ts'),
//       path.join(awsCdkSrcDir, moduleName, 'policy.d.ts'),
//     ],
//     // Result of CDKTF Ref retrieval
//     outputRefFiles: [
//       path.join(markdownAwsDocs, 'sns_topic.html.markdown'),
//       path.join(markdownAwsDocs, 'sns_topic_policy.html.markdown'),
//       path.join(markdownAwsDocs, 'sns_topic_data_protection_policy.html.markdown'),
//     ],
//     // outputPath: path.join('test', 'aws', 'notify', 'sns.test.ts'),
//   },
// ],

/**
 * A function to prepare the Unit Test conversion requests from the batchRetrieveCdktfRefs step
 *
 * @param input - The input files and their CDKTF references
 * @returns The source conversion requests for the sourceConverter agent
 */
export async function batchConvertUnitTestsRequests(
  input: z.infer<typeof batchConvertUnitTestsRequestsInputSchema>,
  // outputModule: string,
): Promise<z.infer<typeof batchConvertUnitTestsRequestsOutputSchema>> {
  const batchConvertRequests: z.infer<typeof batchConvertUnitTestsRequestsOutputSchema> = [];

  // flat map all the references from the source code conversion
  const markdownHclDocsFiles: string[] = [];
  for (const inputFile of input.batchRetrieveCdktfRefs) {
    // - get HCL markdown file from ragResults>ragResult>rerankedResults>metadata>url
    for (const ragResult of inputFile.ragResults) {
      for (const rerankedResult of ragResult.rerankedResults) {
        const metadata = rerankedResult.metadata;
        if (metadata && metadata.url) {
          // Handle Docs URL to Markdown file conversion
          // https://registry.terraform.io/providers/.../docs/resources/sns_topic > r/aws/sns_topic.html.markdown
          const parsedUrl = new URL(metadata.url);
          const docPath = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.substring(1) : parsedUrl.pathname;
          // Split the path and pop the last part (e.g., "ami")
          const resourceName = docPath.split('/').pop();
          if (!resourceName) {
            console.log(`Invalid CDKTF Ref for ${inputFile.inputFile}: ${JSON.stringify(metadata, null, 2)}`);
            throw new Error('Invalid metadata.url: ' + metadata.url);
          }
          const markdownHclDocsFile = path.join(markdownHclAwsDocs, 'r', `${resourceName}.html.markdown`);
          markdownHclDocsFiles.push(markdownHclDocsFile);
        } else {
          console.log(`Invalid CDKTF Ref for ${inputFile.inputFile}: ${JSON.stringify(metadata, null, 2)}`);
          throw new Error('Invalid metadata: ' + JSON.stringify(metadata, null, 2));
        }
      }
    }
  }
  for (const inputFile of input.testInputFiles.inputFiles) {
    batchConvertRequests.push({
      inputFile: inputFile.inputFile,
      inputRefFiles: inputFile.inputRefs,
      outputRefFiles: markdownHclDocsFiles,
    });
  }
  return batchConvertRequests;
}

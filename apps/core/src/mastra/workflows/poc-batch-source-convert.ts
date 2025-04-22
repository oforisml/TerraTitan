import path from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { batchRetrieveCdktfRefsOutputSchema } from './steps/batch-cdktf-ref-rag.js';
import { sourceConverter } from '../agents/source-converter/index.js';
import { gitRoot } from '../util/helpers.js';

const tsAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'typescript', 'provider-aws');

export const sourceConversionSchema = z.object({
  inputFile: z.string(),
  inputRefFiles: z.array(z.string()),
  outputRefFiles: z.array(z.string()),
  // outputPath: z.string().optional(),
});

/**
 * The initial Init data for the workflow
 */
export const triggerSchema = z.object({
  /**
   * The Upstream Module information to use for the conversion
   */
  cacheFile: z.string(),
});
export type TriggerDataType = z.infer<typeof triggerSchema>;
/**
 * A step to convert source code from AWS CDK to TerraConstructs
 */
export const batchConvertSourceCode = new Step({
  id: 'convert-source-code',
  inputSchema: batchRetrieveCdktfRefsOutputSchema,
  outputSchema: z.array(
    z.object({
      code: z.string(),
    }),
  ),
  execute: async ({ context }) => {
    const { cacheFile } = triggerSchema.parse(context.triggerData);
    // TODO: should read step result from the previous step
    const cacheString = readFileSync(cacheFile, 'utf-8');
    const batchRetrieveCdktfRefs = batchRetrieveCdktfRefsOutputSchema.parse(JSON.parse(cacheString));
    const batchConvertResults: any = [];
    for (const inputFile of batchRetrieveCdktfRefs) {
      // get markdown file from ragResults>ragResult>rerankedResults>metadata>url
      const markdownFiles: string[] = [];
      for (const ragResult of inputFile.ragResults) {
        for (const rerankedResult of ragResult.rerankedResults) {
          const metadata = rerankedResult.metadata;
          if (metadata && metadata.url) {
            const parsedUrl = new URL(metadata.url);
            // Remove the leading slash from pathname
            const docPath = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.substring(1) : parsedUrl.pathname;

            // Split the path and pop the last part (e.g., "ami")
            const resourceName = docPath.split('/').pop();
            const docFilePath = path.join(tsAwsDocs, 'r', `${resourceName}.html.markdown`);
            markdownFiles.push(docFilePath);
          }
        }
      }
      const conversionRequest = {
        inputFile: inputFile.inputFile,
        inputRefFiles: inputFile.inputRefs.map(inputRef => inputRef.sourceFile),
        outputRefFiles: markdownFiles,
      };
      // console.log('Found Source Conversion request: ' + JSON.stringify(conversionRequest, null, 2));
      const result = await sourceConverter.convert(conversionRequest);
      batchConvertResults.push(result);
    }
    return batchConvertResults;
  },
});

/**
 * The workflow to convert AWS-CDK module to CDKTF
 */
export const batchConversionWorkflow = new Workflow({
  name: 'batch-conversion-workflow',
  triggerSchema,
});
batchConversionWorkflow.step(batchConvertSourceCode).commit();

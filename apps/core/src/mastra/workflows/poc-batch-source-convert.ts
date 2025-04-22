import { readFileSync } from 'node:fs';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { batchRetrieveCdktfRefsOutputSchema } from './steps/batch-cdktf-ref-rag.js';
import { batchConvertSourceCodeRequests } from './steps/batch-source-convert.js';
import { sourceConverter } from '../agents/source-converter/index.js';

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

export const batchConvertSourceCodeResultSchema = z.array(
  z.object({
    /**
     * The converted TerraConstructs source code
     */
    code: z.string(),
  }),
);

/**
 * A step to convert a Batch of source code from AWS CDK to TerraConstructs
 */
export const batchConvertSourceCode = new Step({
  id: 'convert-source-code',
  inputSchema: batchRetrieveCdktfRefsOutputSchema,
  outputSchema: batchConvertSourceCodeResultSchema,
  execute: async ({ context }) => {
    // TODO: get results from previous step instead of cache file
    const { cacheFile } = triggerSchema.parse(context.triggerData);
    const cacheString = readFileSync(cacheFile, 'utf-8');
    const batchRetrieveCdktfRefs = batchRetrieveCdktfRefsOutputSchema.parse(JSON.parse(cacheString));

    // TODO: Add rate limiters for calling sourceConverter Agent
    const batchConvertResults: z.infer<typeof batchConvertSourceCodeResultSchema> = [];
    for (const conversionRequest of await batchConvertSourceCodeRequests(batchRetrieveCdktfRefs)) {
      const result = await sourceConverter.convert(conversionRequest);
      batchConvertResults.push(result);
    }
    return batchConvertResults;
  },
});

/**
 * The workflow to convert a batch of source code from AWS CDK to TerraConstructs
 * using the sourceConverter Agent
 */
export const batchConversionWorkflow = new Workflow({
  name: 'batch-conversion-workflow',
  triggerSchema,
});
batchConversionWorkflow.step(batchConvertSourceCode).commit();

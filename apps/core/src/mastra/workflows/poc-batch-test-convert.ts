import { readFileSync, writeFileSync } from 'node:fs';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { findTestInputRefs } from './steps/find-input-refs.js';
import { batchRetrieveCdktfRefsOutputSchema } from './steps/batch-cdktf-ref-rag.js';
import { batchConvertUnitTestsRequests } from './steps/batch-test-convert.js';
import { unitConverter } from '../agents/unit-converter/index.js';

export const testConversionSchema = z.object({
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
   * The Upstream Module Name unit test conversion
   */
  moduleName: z.string(),
  /**
   * The local path to Upstream module
   */
  upstreamDir: z.string(),
  /**
   * The Upstream Module information to use for the conversion
   */
  cacheFile: z.string(),
});
export type TriggerDataType = z.infer<typeof triggerSchema>;

export const batchConvertUnitTestResultSchema = z.array(
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
export const batchConvertTestCode = new Step({
  id: 'convert-test-code',
  outputSchema: batchConvertUnitTestResultSchema,
  execute: async ({ context }) => {
    const { cacheFile, moduleName, upstreamDir } = triggerSchema.parse(context.triggerData);
    // TODO: get results from previous step instead of cache file
    const cacheString = readFileSync(cacheFile, 'utf-8');
    const batchRetrieveCdktfRefs = batchRetrieveCdktfRefsOutputSchema.parse(JSON.parse(cacheString));
    // TODO: get results from findTestInputRefs step instead of cache file
    const testInputFiles = await findTestInputRefs({
      moduleName,
      upstreamDir,
      repo: 'aws-cdk',
      tag: 'v2.186.0',
      created: false,
    });

    // TODO: Add rate limiters for calling unitConverter Agent
    const unitTestConversionRequests = await batchConvertUnitTestsRequests({
      testInputFiles,
      batchRetrieveCdktfRefs,
    });
    const batchConvertResults: z.infer<typeof batchConvertUnitTestResultSchema> = [];
    console.log(`Unit Test Conversion Requests...`);
    for (const conversionRequest of unitTestConversionRequests) {
      console.log(JSON.stringify(conversionRequest, null, 2));

      // const result = await unitConverter.convert(conversionRequest);
      // writeFileSync(`result-${index++}`, result.code, 'utf-8');
      batchConvertResults.push({
        code: `// ${conversionRequest.inputFile} converted`,
      });
    }
    return batchConvertResults;
  },
});

/**
 * The workflow to convert a batch of source code from AWS CDK to TerraConstructs
 * using the sourceConverter Agent
 */
export const batchTestConversionWorkflow = new Workflow({
  name: 'batch-test-conversion-workflow',
  triggerSchema,
});
batchTestConversionWorkflow.step(batchConvertTestCode).commit();

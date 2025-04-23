import path from 'path';
import { Workflow, Step } from '@mastra/core/workflows';
import { z } from 'zod';
import { ensureUpstreamOutputSchema, ensureUpstreamInputSchema, ensureUpstream } from './steps/ensure-upstream.js';
import { sourceConverter } from '../agents/source-converter/index.js';
import { unitConverter } from '../agents/unit-converter/index.js';
import { sourceConversionRequestSchema, batchConvertSourceCodeRequests } from './steps/batch-source-convert.js';
import { unitTestsConversionSchema, batchConvertUnitTestsRequests } from './steps/batch-test-convert.js';
import { workspaceInputSchema, ensureWorkspace, workspaceOutputSchema } from './steps/ensure-workspace.js';
import { batchWriteCode } from './steps/batch-write-code.js';
import {
  findSrcInputRefs,
  findSrcInputRefsOutputSchema,
  findTestInputRefs,
  findTestInputRefsOutputSchema,
} from './steps/find-input-refs.js';
import {
  batchRetrieveCdktfRefs,
  batchRetrieveCdktfRefsOutputSchema,
  choiceValueSchema,
  mergeSelections,
  prepareBatchReview,
} from './steps/batch-cdktf-ref-rag.js';

/**
 * The initial Init data for the workflow
 */
export const triggerSchema = z.object({
  /**
   * The Upstream Module information to use for the conversion
   */
  upstreamModule: ensureUpstreamInputSchema,
  /**
   * The run the conversion into
   */
  workspace: workspaceInputSchema,
  /**
   * The output module to write to within the Workspace
   */
  outputModule: z.string(),
});
export type TriggerDataType = z.infer<typeof triggerSchema>;

const ensureUpstreamStep = new Step({
  id: 'ensureUpstreamStep',
  description: 'Ensures an upstream module is available for conversion',
  outputSchema: ensureUpstreamOutputSchema,
  execute: async ({ context }) => {
    const input = triggerSchema.parse(context.triggerData);
    return await ensureUpstream(input.upstreamModule);
  },
});

const ensureWorkspaceStep = new Step({
  id: 'ensureWorkspace',
  inputSchema: workspaceInputSchema,
  outputSchema: workspaceOutputSchema,
  execute: async ({ context }) => {
    const input = triggerSchema.parse(context.triggerData);
    return await ensureWorkspace(input.workspace);
  },
});

const findLibInputRefsStep = new Step({
  id: 'find-lib-input-refs',
  description: 'Discovers Source Code input references for the conversion',
  inputSchema: ensureUpstreamOutputSchema,
  outputSchema: findSrcInputRefsOutputSchema,
  execute: async ({ context }) => {
    const upstreamDetails = context.getStepResult(ensureUpstreamStep);
    console.log(`Finding Source Code Input references in ${upstreamDetails.upstreamDir}`);
    return await findSrcInputRefs(upstreamDetails);
  },
});

const findTestInputRefsStep = new Step({
  id: 'find-test-input-refs',
  description: 'Discovers Source Code input references for the conversion',
  inputSchema: ensureUpstreamOutputSchema,
  outputSchema: findTestInputRefsOutputSchema,
  execute: async ({ context }) => {
    const upstreamDetails = context.getStepResult(ensureUpstreamStep);
    console.log(`Finding Unit Test Input references in ${upstreamDetails.upstreamDir}`);
    return await findTestInputRefs(upstreamDetails);
  },
});

const findLibCdktfRefsStep = new Step({
  id: 'find-lib-output-refs',
  description: 'CDKTF reference retrieval for the conversion',
  inputSchema: findSrcInputRefsOutputSchema,
  outputSchema: batchRetrieveCdktfRefsOutputSchema,
  execute: async ({ context }) => {
    const srcInputRefs = context.getStepResult(findLibInputRefsStep);
    console.log(`Finding CDKTF references for ${srcInputRefs.inputFiles.length} source files`);
    return await batchRetrieveCdktfRefs(srcInputRefs);
  },
});

const cdktfRefReviewResumeSchema = z.object({
  selectedReferences: z.array(choiceValueSchema),
});
export type CdktfRefReviewResumeType = z.infer<typeof cdktfRefReviewResumeSchema>;
export const reviewCdktfRefsStep = new Step({
  id: 'review-cdktf-refs',
  description: 'Human in the loop review of all CDKTF reference suggestions in the batch',
  inputSchema: cdktfRefReviewResumeSchema, // resume schema
  outputSchema: batchRetrieveCdktfRefsOutputSchema,
  execute: async ({ context, suspend }) => {
    const batch = context.getStepResult(findLibCdktfRefsStep); // input schema
    // Access the human input provided when resuming the workflow
    if (context.inputData?.selectedReferences) {
      // answer will be an array of the `value` objects from `choices`
      const { selectedReferences } = cdktfRefReviewResumeSchema.parse(context.inputData);
      const mergedBatch = mergeSelections(batch, selectedReferences);
      // console.log('Merged Batch', JSON.stringify(mergedBatch, null, 2));
      return mergedBatch;
    }
    const { updatedBatch, reviewPayload } = prepareBatchReview(batch, 0.7);
    if (reviewPayload) {
      // suspend with the single payload
      await suspend(reviewPayload);
    }
    // no review needed
    // console.log('Updated Batch', JSON.stringify(updatedBatch, null, 2));
    return updatedBatch;
  },
});

// result from sourceConverter agent(s) merged into the sourceCodeConversions
const sourceConversionResultSchema = z.array(
  sourceConversionRequestSchema.extend({
    /**
     * The converted TerraConstructs Source Code
     */
    code: z.string(),
  }),
);

/**
 * A step to convert a Batch of source code from AWS CDK to TerraConstructs
 */
export const batchConvertSourceCodeStep = new Step({
  id: 'convert-source-code',
  description: 'Convert a batch of reviewed Source Code conversion inputs',
  inputSchema: batchRetrieveCdktfRefsOutputSchema,
  outputSchema: sourceConversionResultSchema,
  execute: async ({ context }) => {
    const batchRetrieveCdktfRefs = context.getStepResult(reviewCdktfRefsStep); // input schema
    console.log(`Running source conversions for ${batchRetrieveCdktfRefs.length} source files`);
    // TODO: Add rate limiters for calling sourceConverter Agent
    const batchConvertResults: z.infer<typeof sourceConversionResultSchema> = [];
    for (const conversionRequest of await batchConvertSourceCodeRequests(batchRetrieveCdktfRefs)) {
      try {
        const result = await sourceConverter.convert(conversionRequest);
        batchConvertResults.push({
          ...conversionRequest,
          code: result.code,
        });
      } catch (error) {
        console.error(`Error converting ${conversionRequest.inputFile}: ${error}`);
        throw error;
      }
    }
    return batchConvertResults;
  },
});

// result from unitConverter agent(s) merged into the unitTestsConversions
const unitTestsConversionResultSchema = z.array(
  unitTestsConversionSchema.extend({
    /**
     * The converted TerraConstructs Unit Tests
     */
    code: z.string(),
  }),
);

/**
 * A step to convert a Batch of Unit Tests from AWS CDK to TerraConstructs
 */
export const batchConvertUnitTestsStep = new Step({
  id: 'convert-test-code',
  description: 'Convert a batch of Unit Test conversion inputs',
  outputSchema: unitTestsConversionResultSchema,
  execute: async ({ context }) => {
    const batchRetrieveCdktfRefs = context.getStepResult(reviewCdktfRefsStep);
    const testInputFiles = context.getStepResult(findTestInputRefsStep);
    console.log(`Running Unit Test conversions for ${testInputFiles.inputFiles.length} Unit Test files`);

    // TODO: Add rate limiters for calling unitConverter Agent
    const unitTestConversionRequests = await batchConvertUnitTestsRequests({
      testInputFiles,
      batchRetrieveCdktfRefs,
    });
    const batchConvertResults: z.infer<typeof unitTestsConversionResultSchema> = [];
    for (const conversionRequest of unitTestConversionRequests) {
      try {
        const result = await unitConverter.convert(conversionRequest);
        batchConvertResults.push({
          ...conversionRequest,
          code: result.code,
        });
      } catch (error) {
        console.error(`Error converting ${conversionRequest.inputFile}: ${error}`);
        throw error;
      }
    }
    return batchConvertResults;
  },
});

const batchWriteToWorkspaceStep = new Step({
  id: 'write-to-workspace',
  description: 'Write the converted Source Code and Unit Tests to the workspace',
  outputSchema: z.array(z.string()),
  execute: async ({ context }) => {
    const batchSourceConvertResults = context.getStepResult(batchConvertSourceCodeStep);
    const batchTestConvertResults = context.getStepResult(batchConvertUnitTestsStep);

    console.log(
      `Writing ${batchSourceConvertResults.length} source files and ${batchTestConvertResults.length} unit test files to the workspace`,
    );

    const workspace = context.getStepResult(ensureWorkspaceStep);
    const outputModule = triggerSchema.parse(context.triggerData).outputModule;
    const writtenFiles: string[] = [];
    // TODO: Handle rawFiles from upstream module (copy as-is to workspace)
    // Write the converted source code to the Workspace

    const sourceCodeFiles = await batchWriteCode(
      batchSourceConvertResults.map(sourceConvertResult => ({
        inputFile: sourceConvertResult.inputFile,
        code: sourceConvertResult.code,
        workspace,
        infixPath: path.join('src', 'aws'),
        outputModule,
      })),
    );
    writtenFiles.push(...sourceCodeFiles);
    // Write the converted unit tests to the Workspace
    const unitTestFiles = await batchWriteCode(
      batchTestConvertResults.map(testConvertResult => ({
        inputFile: testConvertResult.inputFile,
        code: testConvertResult.code,
        workspace,
        infixPath: path.join('test', 'aws'),
        outputModule,
      })),
    );
    writtenFiles.push(...unitTestFiles);

    // TODO: When files are renamed due to conflicts, imports also need to be updated...

    return writtenFiles;
  },
});

/**
 * The workflow to convert AWS-CDK module to CDKTF
 */
export const conversionWorkflow = new Workflow({
  name: 'conversionWorkflow',
  triggerSchema,
});
conversionWorkflow
  .step(ensureUpstreamStep)
  .then(ensureWorkspaceStep)
  .then(findLibInputRefsStep)
  .then(findTestInputRefsStep)
  .then(findLibCdktfRefsStep)
  .then(reviewCdktfRefsStep)
  // TODO: parallel conversions of Source Code and Unit Tests
  .then(batchConvertSourceCodeStep)
  .then(batchConvertUnitTestsStep)
  .then(batchWriteToWorkspaceStep)
  .commit();

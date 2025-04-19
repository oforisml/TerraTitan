// import fs from 'node:fs/promises';
// import path from 'node:path';
// import { checkbox } from '@inquirer/prompts';
import { createWorkflow, createStep } from '@mastra/core/workflows/vNext';
import { z } from 'zod';
import { ensureUpstreamOutputSchema, ensureUpstreamInputSchema, ensureUpstream } from './steps/ensure-upstream.js';
// import { sourceConverter } from '../agents/source-converter/index.js';
// import { unitConverter } from '../agents/unit-converter/index.js';
import { workspaceInputSchema, ensureWorkspace, workspaceOutputSchema } from './steps/ensure-workspace.js';
// import { ragReviewDecisionSchema, reviewCdktfReferences, RAGReviewType } from './steps/review-cdktf-ref.js';
import { InputRefType, findInputRefs, findInputRefsOutputSchema } from './steps/find-input-refs.js';
import {
  batchRetrieveCdktfRefs,
  batchRetrieveCdktfRefsOutputSchema,
  choiceValueSchema,
  reviewPayloadSchema as cdktfRefReviewPayloadSchema,
  mergeSelections,
  prepareBatchReview,
} from './steps/batch-cdktf-ref-rag.js';

/**
 * The initial Init data for the workflow
 */
export const initSchema = z.object({
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

export type InitType = z.infer<typeof initSchema>;

/**
 * Ensure the upstream module is available for conversion
 */
const ensureUpstreamStep = createStep({
  id: 'ensure-upstream',
  description: 'Ensures an upstream module is available for conversion',
  inputSchema: initSchema,
  outputSchema: ensureUpstreamOutputSchema,
  execute: async ({ inputData }) => {
    return await ensureUpstream(inputData.upstreamModule);
  },
});

/**
 * A step to walk the upstream directory and find all the lib input references
 */
const findLibInputRefsStep = createStep({
  id: 'find-lib-input-refs',
  description: 'Finds the Source Code input references for the conversion',
  inputSchema: ensureUpstreamOutputSchema,
  outputSchema: findInputRefsOutputSchema,
  execute: async ({ inputData }) => {
    const upstreamDetails = ensureUpstreamOutputSchema.parse(inputData);
    return await findInputRefs(upstreamDetails, InputRefType.LIB);
  },
});

const findLibCdktfRefsStep = createStep({
  id: 'find-lib-output-refs',
  description: 'Finds the Source Code CDKTF references for the conversion',
  inputSchema: findInputRefsOutputSchema,
  outputSchema: batchRetrieveCdktfRefsOutputSchema,
  execute: async ({ inputData }) => {
    const findCdktfRefs = findInputRefsOutputSchema.parse(inputData);
    return await batchRetrieveCdktfRefs(findCdktfRefs);
  },
});

const cdktfRefReviewResumeSchema = z.array(choiceValueSchema);
export const reviewCdktfRefsStep = createStep({
  id: 'review-cdktf-refs',
  description: 'Human in the loop review of all CDKTF reference suggestions in the batch',
  inputSchema: batchRetrieveCdktfRefsOutputSchema,
  suspendSchema: cdktfRefReviewPayloadSchema,
  resumeSchema: cdktfRefReviewResumeSchema,
  outputSchema: batchRetrieveCdktfRefsOutputSchema,
  execute: async ({ resumeData, inputData, suspend }) => {
    const batch = batchRetrieveCdktfRefsOutputSchema.parse(inputData);
    const { updatedBatch, reviewPayload } = prepareBatchReview(batch, 0.7);
    console.log('Review Payload', JSON.stringify(reviewPayload, null, 2));
    if (reviewPayload) {
      console.log('Suspending for review');
      // suspend with the single payload
      await suspend(reviewPayload);

      // answer will be an array of the `value` objects from `choices`
      const selections = cdktfRefReviewResumeSchema.parse(resumeData);

      // merge back into updatedBatch however you need...
      const mergedBatch = mergeSelections(updatedBatch, selections);
      console.log('Merged Batch', JSON.stringify(mergedBatch, null, 2));
    }

    // no review needed
    console.log('Updated Batch', JSON.stringify(updatedBatch, null, 2));
    return updatedBatch;
  },
});

// /**
//  * A step to walk the upstream directory and find all the test input references
//  */
// const findTestInputRefsStep = createStep({
//   id: 'find-lib-input-refs',
//   description: 'Finds the Unit Tests input references for the conversion',
//   inputSchema: ensureUpstreamOutputSchema,
//   outputSchema: findInputRefsOutputSchema,
//   execute: async ({ inputData }) => {
//     const upstreamDetails = ensureUpstreamOutputSchema.parse(inputData);
//     return await findInputRefs(upstreamDetails, InputRefType.TEST);
//   },
// });

export const findUpstreamInputRefsWorkflow = createWorkflow({
  id: 'find-upstream-input-refs',
  inputSchema: initSchema,
  outputSchema: findInputRefsOutputSchema,
  steps: [ensureUpstreamStep, findLibInputRefsStep, findLibCdktfRefsStep, reviewCdktfRefsStep],
});
findUpstreamInputRefsWorkflow
  .then(ensureUpstreamStep)
  .then(findLibInputRefsStep)
  .then(findLibCdktfRefsStep)
  .then(reviewCdktfRefsStep)
  .commit();

const ensureWorkspaceStep = createStep({
  id: 'ensure-workspace',
  description: 'Ensures a workspace is available for conversion',
  inputSchema: initSchema,
  outputSchema: workspaceOutputSchema,
  execute: async ({ inputData }) => {
    return await ensureWorkspace(inputData.workspace);
  },
});

/**
 * Final Conversion workflow (vNext)
 */
export const vNextWorkflow = createWorkflow({
  id: 'vnext-workflow',
  inputSchema: initSchema,
  outputSchema: z.object({
    result: z.string(),
  }),
  steps: [findUpstreamInputRefsWorkflow, ensureWorkspaceStep],
});

vNextWorkflow.parallel([ensureWorkspaceStep, findUpstreamInputRefsWorkflow]).commit();

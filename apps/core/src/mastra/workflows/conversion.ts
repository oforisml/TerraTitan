import { Workflow, Step } from '@mastra/core/workflows';
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

const findLibInputRefsStep = new Step({
  id: 'find-lib-input-refs',
  description: 'Discovers Source Code input references for the conversion',
  inputSchema: ensureUpstreamOutputSchema,
  outputSchema: findInputRefsOutputSchema,
  execute: async ({ context }) => {
    const upstreamDetails = context.getStepResult(ensureUpstreamStep);
    return await findInputRefs(upstreamDetails, InputRefType.LIB);
  },
});

const findLibCdktfRefsStep = new Step({
  id: 'find-lib-output-refs',
  description: 'CDKTF reference retrieval for the conversion',
  inputSchema: findInputRefsOutputSchema,
  outputSchema: batchRetrieveCdktfRefsOutputSchema,
  execute: async ({ context }) => {
    const findCdktfRefs = context.getStepResult(findLibInputRefsStep);
    return await batchRetrieveCdktfRefs(findCdktfRefs);
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

/**
 * The workflow to convert AWS-CDK module to CDKTF
 */
export const conversionWorkflow = new Workflow({
  name: 'conversionWorkflow',
  triggerSchema,
});
conversionWorkflow
  .step(ensureUpstreamStep)
  .then(findLibInputRefsStep)
  .then(findLibCdktfRefsStep)
  .then(reviewCdktfRefsStep)
  .commit();

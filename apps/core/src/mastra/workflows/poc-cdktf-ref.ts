import { Workflow, Step } from '@mastra/core/workflows';
import { z } from 'zod';
import {
  ragResultSchema,
  retrieveCdktfRefSchema,
  ragRerankResultSchema,
  retrieveCdktfReferences,
} from './steps/retrieve-cdktf-ref.js';
import { ragReviewDecisionSchema, reviewCdktfReferences } from './steps/review-cdktf-ref.js';

export type { RAGReviewType } from './steps/review-cdktf-ref.js';
export type { TriggerType } from './steps/retrieve-cdktf-ref.js';

export type RerankedResultType = z.infer<typeof ragRerankResultSchema>;
export type RAGResultType = z.infer<typeof ragResultSchema>;
export type RAGReviewDecisionType = z.infer<typeof ragReviewDecisionSchema>;

/**
 * Sample workflow to retrieve CDKTF references
 * and review them using a human-in-the-loop approach.
 */
export const cdktfRefWorkflow = new Workflow({
  name: 'cdktfRefWorkflow',
  triggerSchema: retrieveCdktfRefSchema,
});

const retrieveCdktfReferencesStep = new Step({
  id: 'retrieveCdktfReferences',
  outputSchema: ragResultSchema,
  execute: async ({ context }) => {
    const input = retrieveCdktfRefSchema.parse(context.triggerData);
    return await retrieveCdktfReferences(input);
  },
});

const reviewCdktfReferencesStep = new Step({
  id: 'reviewCdktfReferences',
  // Schema for human input that will be provided when resuming workflow
  inputSchema: ragReviewDecisionSchema,
  outputSchema: ragResultSchema,
  execute: async ({ context, suspend }) => {
    const ragResults = context.getStepResult(retrieveCdktfReferencesStep);
    return await reviewCdktfReferences(
      ragResults,
      suspend,
      // Pass the human input to the review function
      context.inputData,
    );
  },
});

cdktfRefWorkflow.step(retrieveCdktfReferencesStep).then(reviewCdktfReferencesStep).commit();

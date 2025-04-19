import * as path from 'path';
import { z } from 'zod';
import { gitRoot } from '../../util/helpers.js';
import { retrieveCdktfRefSchema, ragResultSchema, ragRerankResultSchema } from './retrieve-cdktf-ref.js';

// request Review of RAG results
export const ragReviewSchema = ragResultSchema.extend({
  message: z.string().optional(),
});

/**
 * Schema for human input that will be provided when resuming workflow
 */
export const ragReviewDecisionSchema = retrieveCdktfRefSchema.extend({
  rerankedResults: z.array(
    ragRerankResultSchema.extend({
      /**
       * Optional modified score assigned by human reviewer
       */
      modifiedScore: z.number().optional(),
    }),
  ),
});

export type RAGReviewType = z.infer<typeof ragReviewSchema>;

export async function reviewCdktfReferences(
  ragResults: z.infer<typeof ragResultSchema>,
  suspend: (payload?: unknown, softSuspend?: any) => Promise<void>,
  resumeInput?: z.infer<typeof ragReviewDecisionSchema>,
): Promise<z.infer<typeof ragResultSchema>> {
  // If no RAG results scored lower than 0.7 on reranking, do not require human review
  if (ragResults?.rerankedResults?.every(result => result.rerankedScore > 0.7)) {
    return ragResults;
  }
  // Access the human input provided when resuming the workflow
  const ragReviewInput = {
    rerankedResults: resumeInput?.rerankedResults,
  };
  // If we don't have rerankedResults yet, suspend for human review
  if (!ragReviewInput.rerankedResults) {
    const suspendPayload: RAGReviewType = {
      sourceFile: ragResults?.sourceFile,
      sourceClass: ragResults?.sourceClass,
      rerankedResults: ragResults?.rerankedResults || [],
      message: `Please review suggested CDKTF References for ${path.relative(gitRoot, ragResults?.sourceFile)} - ${ragResults?.sourceClass} (select 2-5)`,
    };
    await suspend(suspendPayload);

    // Placeholder return
    return ragResults;
  }

  // Process the human input
  if (ragReviewInput.rerankedResults.length === 0) {
    throw new Error(`No results selected for: ${ragResults?.sourceFile} - ${ragResults?.sourceClass}`);
  }
  // Consider using https://github.com/th0r/inquirer-sortable-checkbox for re-ordering...
  // If the human reviewer re-ordered (modified) the scores, use those?
  const finalResults = ragReviewInput.rerankedResults.map(result => {
    if (result.modifiedScore) {
      return {
        ...result,
        rerankedScore: result.modifiedScore,
      };
    }
    return result;
  });
  return {
    sourceFile: ragResults?.sourceFile,
    sourceClass: ragResults?.sourceClass,
    rerankedResults: finalResults,
  };
}

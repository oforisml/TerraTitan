import * as path from 'path';
import { ragResultSchema, retrieveCdktfReferences } from './retrieve-cdktf-ref.js';
import { findSrcInputRefsOutputSchema, srcInputSchema } from './find-input-refs.js';
import { gitRoot } from '../../util/helpers.js';
import { z } from 'zod';

export const batchRetrieveCdktfRefsOutputSchema = z.array(
  srcInputSchema.extend({
    ragResults: z.array(ragResultSchema),
  }),
);

/**
 * A step to batch retrieve CDKTF references for a list of input files
 *
 * @param input - The input files to retrieve CDKTF references for
 * @returns The CDKTF references for the input files
 */
export async function batchRetrieveCdktfRefs(
  input: z.infer<typeof findSrcInputRefsOutputSchema>,
  // outputModule: string,
): Promise<z.infer<typeof batchRetrieveCdktfRefsOutputSchema>> {
  // TODO: Add rate limiters?
  // ref: https://github.com/vercel/async-sema?tab=readme-ov-file#ratelimitrps--timeunit-uniformdistribution-
  return Promise.all(
    input.inputFiles.map(async inputFile => {
      return {
        ...inputFile,
        ragResults: await Promise.all(inputFile.inputRefs.map(inputRef => retrieveCdktfReferences(inputRef))),
      };
    }),
  );
}

export const choiceValueSchema = z.object({
  inputFile: z.string(),
  sourceFile: z.string(),
  sourceClass: z.string(),
  id: z.string(),
});

/**
 * Schema for grouped choices
 */
const groupedChoicesSchema = z.object({
  /**
   *  Group Name
   */
  name: z.string(),
  /**
   *  Group Description
   */
  description: z.string(),
  /**
   *  Grouped Choices
   */
  choices: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      value: choiceValueSchema,
      checked: z.boolean().optional(),
    }),
  ),
});

export const reviewPayloadSchema = z.object({
  /**
   * Message to display to the user
   */
  message: z.string(),
  /**
   * Groups of choices for user to select from
   */
  groupedChoices: z.array(groupedChoicesSchema),
});

export type ReviewPayload = z.infer<typeof reviewPayloadSchema>;

/**
 * Returns:
 *  - updatedBatch
 *  - reviewPayload if **any** score ≤ threshold, else undefined
 */
export function prepareBatchReview(
  batch: z.infer<typeof batchRetrieveCdktfRefsOutputSchema>,
  threshold = 0.7,
): {
  updatedBatch: z.infer<typeof batchRetrieveCdktfRefsOutputSchema>;
  reviewPayload?: ReviewPayload;
} {
  // 1. Check if any score is below threshold after reranking
  const needsReview = batch.some(file =>
    file.ragResults.some(r => r.rerankedResults.some(rr => rr.rerankedScore <= threshold)),
  );

  // 2. If nothing needs review, skip
  if (!needsReview) {
    return { updatedBatch: batch };
  }

  // 3. Otherwise, build choices for *all* ragResults
  const groupedChoicesMap = new Map<string, z.infer<typeof groupedChoicesSchema>>();
  for (const file of batch) {
    const groupName = path.relative(gitRoot, file.inputFile);
    let group = groupedChoicesMap.get(groupName);
    if (!group) {
      group = {
        name: groupName,
        description: `Select CDKTF references for ${groupName}`,
        choices: [],
      };
      groupedChoicesMap.set(groupName, group);
    }
    // add choices to group
    const choices = file.ragResults.flatMap(r =>
      r.rerankedResults.map(rr => ({
        name: `${rr.rerankedScore.toFixed(2)} - ${r.sourceClass} - ${rr.id}`,
        description: rr.metadata.originalText,
        value: {
          inputFile: file.inputFile,
          sourceFile: r.sourceFile,
          sourceClass: r.sourceClass,
          id: rr.id,
        },
        checked: rr.rerankedScore > threshold,
      })),
    );
    group.choices.push(...choices);
  }
  // filter out any groups that have empty choice array
  const filteredGroups = Array.from(groupedChoicesMap.values()).filter(group => group.choices.length > 0);

  // 4. Single, global review message
  const message = `Some CDKTF mappings scored below ${threshold}. Please review *all* suggestions (select 2–5 per group).`;

  return {
    updatedBatch: batch,
    reviewPayload: { message, groupedChoices: filteredGroups },
  };
}

/**
 * Given the original batch + the user's selections, produce a new batch where
 * each ragResult.rerankedResults only contains the IDs the user picked.
 */
export function mergeSelections(
  batch: z.infer<typeof batchRetrieveCdktfRefsOutputSchema>,
  selections: Array<z.infer<typeof choiceValueSchema>>,
): z.infer<typeof batchRetrieveCdktfRefsOutputSchema> {
  // Build a map: key = inputFile::sourceFile::sourceClass → Set of selected IDs
  const selectedMap = new Map<string, Set<string>>();
  for (const sel of selections) {
    const key = `${sel.inputFile}::${sel.sourceFile}::${sel.sourceClass}`;
    if (!selectedMap.has(key)) {
      selectedMap.set(key, new Set());
    }
    selectedMap.get(key)!.add(sel.id);
  }

  // Reconstruct the batch
  return batch.map(file => {
    const newRagResults = file.ragResults.map(r => {
      const key = `${file.inputFile}::${r.sourceFile}::${r.sourceClass}`;
      const ids = selectedMap.get(key);
      // If the user made no selection for this item, you could:
      //  - leave all the original candidates,
      //  - throw an error,
      //  - or treat it as “skip human review” for that item.
      // Here we’ll default to throwing if nothing was selected:
      if (ids && ids.size > 0) {
        return {
          ...r,
          rerankedResults: r.rerankedResults.filter(rr => ids.has(rr.id)),
        };
      } else {
        throw new Error(`No selection provided for ${file.inputFile} → ${r.sourceClass}`);
      }
    });

    return { ...file, ragResults: newRagResults };
  });
}

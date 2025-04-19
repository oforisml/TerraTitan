import path from 'node:path';
import fs from 'node:fs/promises';
import { Mastra } from '@mastra/core';
import { WorkflowContext } from '@mastra/core/workflows';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMastra(mastra: any): mastra is Mastra {
  return mastra && typeof mastra === 'object' && mastra instanceof Mastra;
}

export const conversionOutputSchema = z.object({
  code: z.string(),
  outputPath: z.string(),
});

type ConversionType = z.infer<typeof conversionOutputSchema>;

/**
 * A function to write code output from a conversion step to the ensureWorkspace step's targetDir
 *
 * @param stepId - The ID of the step to write code from
 */
export function writeCodeFromStep(stepId: string): (context: { context: WorkflowContext }) => Promise<void> {
  return async ({ context }) => {
    const { targetDir } = context.getStepResult('ensureWorkspace');
    if (!targetDir) {
      throw new Error('Target directory not found in ensureWorkspace step');
    }
    const { code, outputPath } = context.getStepResult(stepId) as ConversionType;
    if (!code || !outputPath) {
      throw new Error(`Step ${stepId} did not return code or outputPath`);
    }
    const resultPath = path.join(targetDir, outputPath);
    console.log(`Writing code from step ${stepId} to workspace ${resultPath}`);
    await fs.writeFile(resultPath, code);
  };
}

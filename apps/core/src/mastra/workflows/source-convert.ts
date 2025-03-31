import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { sourceConverter } from '../agents/source-converter/index.js';

export const sourceConversionSchema = z.object({
  inputFile: z.string(),
  inputRefFiles: z.array(z.string()), // TODO: Auto determine
  outputRefFiles: z.array(z.string()), // TODO: Auto determine
  outputPath: z.string().optional(),
});

/**
 * A step to convert source code from AWS CDK to TerraConstructs
 */
export const convertSourceCode = new Step({
  id: 'convertSourceCode',
  inputSchema: z.object({
    conversion: sourceConversionSchema,
  }),
  outputSchema: z.object({
    code: z.string(),
  }),
  execute: async ({ context }) => {
    return await sourceConverter.convert(context.inputData.conversion);
  },
});

/**
 * A workflow to convert source code from AWS CDK to TerraConstructs
 *
 * The workflow is triggered by the `sourceConversionWorkflow` trigger.
 * It uses the `convertSourceCode` step to convert the source code.
 */
export const sourceConversionWorkflow = new Workflow({
  name: 'source-conversion-workflow',
  triggerSchema: z.object({
    conversion: sourceConversionSchema,
  }),
});

// TODO: Add steps to prepare inputRefFiles & outputRefFiles
sourceConversionWorkflow.step(convertSourceCode);
// TODO: Evaluate the generated code against criteria to move to finish code conversion

// Finalize the workflow
sourceConversionWorkflow.commit();

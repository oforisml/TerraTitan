import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { sourceConverter } from '../agents/source-converter/index.js';

/**
 * A step to convert source code from AWS CDK to TerraConstructs
 */
const convertSourceCode = new Step({
  id: 'convertSourceCode',
  inputSchema: z.object({
    inputFile: z.string(),
    inputRefFiles: z.array(z.string()),
    outputRefFiles: z.array(z.string()),
  }),
  outputSchema: z.object({
    code: z.string(),
  }),
  execute: async ({ context }) => {
    const inputFile = context.triggerData.inputFile as string;
    const inputRefFiles = context.triggerData.inputRefFiles as string[];
    const outputRefFiles = context.triggerData.outputRefFiles as string[];
    return await sourceConverter.convert({
      inputFile,
      inputRefFiles,
      outputRefFiles,
    });
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
    inputFile: z.string(),
    inputRefFiles: z.array(z.string()),
    outputRefFiles: z.array(z.string()),
  }),
});

// TODO: Add steps to prepare the workspace
// TODO: Add steps to prepare requestProps
// TODO: Add steps to write the file to the workspace
sourceConversionWorkflow.step(convertSourceCode);

// Finalize the workflow
sourceConversionWorkflow.commit();

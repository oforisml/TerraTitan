import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

import { unitConverter } from '../agents/unit-converter/index.js';

export const unitConversionSchema = z.object({
  inputFile: z.string(),
  inputRefFiles: z.array(z.string()), // TODO: Auto determine
  outputRefFiles: z.array(z.string()), // TODO: Auto determine
  outputPath: z.string().optional(),
});

/**
 * A step to convert unit tests from AWS CDK to TerraConstructs
 */
const convertUnitTests = new Step({
  id: 'convertUnitTests',
  inputSchema: z.object({
    conversion: unitConversionSchema,
  }),
  outputSchema: z.object({
    code: z.string(),
  }),
  execute: async ({ context }) => {
    const { inputFile, inputRefFiles, outputRefFiles } = context.triggerData;
    return await unitConverter.convert({
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
export const unitConversionWorkflow = new Workflow({
  name: 'source-conversion-workflow',
  triggerSchema: z.object({
    conversion: unitConversionSchema,
  }),
});

// TODO: Add steps to prepare the workspace
// TODO: Add steps to prepare requestProps
// TODO: Add steps to write the file to the workspace
unitConversionWorkflow.step(convertUnitTests);
// TODO: Evaluate the generated code against criteria to move to the next step
// TODO: Start loop on resolving issues

// Finalize the workflow
unitConversionWorkflow.commit();

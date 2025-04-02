// TODO: Add Resume / Human in the loop with inquirer
// import { select, input, confirm } from '@inquirer/prompts';
import { Mastra } from '@mastra/core';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { sourceConverter } from '../agents/source-converter/index.js';
import { unitConverter } from '../agents/unit-converter/index.js';
import { isMastra, writeCodeFromStep, workspaceSchema, ensureWorkspace, conversionOutputSchema } from './util.js';

/**
 * A single Conversion request
 */
export const conversionSchema = z.object({
  inputFile: z.string(),
  inputRefFiles: z.array(z.string()), // TODO: Auto determine
  outputRefFiles: z.array(z.string()), // TODO: Auto determine
  outputPath: z.string(),
});

/**
 * Dynamic Workflow trigger schema
 */
const triggerSchema = z.object({
  workspace: workspaceSchema,
  sourceCodeConversions: z.array(conversionSchema),
  unitTestConversions: z.array(conversionSchema),
});

export type TriggerType = z.infer<typeof triggerSchema>;

/**
 * A workflow to run dynamic conversions into a workspace
 */
export const parentWorkflow = new Workflow({
  name: 'parent-workflow',
  triggerSchema: triggerSchema,
  mastra: new Mastra(),
});

/**
 * A step creating dynamic workflows for workspaced source code and unit test conversions
 *
 * @see https://mastra.ai/docs/workflows/dynamic-workflows
 */
const createDynamicWorkflow = new Step({
  id: 'createWorkspaceConversionsWorkflow',
  inputSchema: triggerSchema,
  outputSchema: z.object({
    results: z.any(),
  }),
  execute: async ({ context, mastra }) => {
    if (!mastra) {
      throw new Error('Mastra instance not available');
    }

    if (!isMastra(mastra)) {
      throw new Error('Invalid Mastra instance');
    }

    const inputData = context.getStepResult<TriggerType>('trigger');

    // console.log(`Source code conversions: ${inputData.sourceCodeConversions.map(c => c.inputFile).join(', ')}`);
    // console.log(`Unit test conversions: ${inputData.unitTestConversions.map(c => c.inputFile).join(', ')}`);

    // Create a new dynamic workflow
    const dynamicWorkflow = new Workflow({
      name: 'workspace-conversions-workflow',
      mastra, // Pass the mastra instance to the new workflow
      triggerSchema: triggerSchema,
    });

    dynamicWorkflow
      .step(ensureWorkspace, {
        variables: {
          // INFO: variable.path is passed to https://radash-docs.vercel.app/docs/object/get
          id: { step: 'trigger', path: 'workspace.id' },
          repositoryUrl: { step: 'trigger', path: 'workspace.repositoryUrl' },
        },
      })
      .after(ensureWorkspace);

    // Create parallel steps for each source code conversion
    inputData.sourceCodeConversions.forEach((conversion, index) => {
      // TODO: Use Nested Workflow instead?
      const id = `convertSourceCode-${index}`;
      const convertSourceCode = new Step({
        id,
        outputSchema: conversionOutputSchema,
        execute: async () => {
          console.log(`${id}: ${conversion.inputFile} > ${conversion.outputPath}`);
          const result = await sourceConverter.convert(conversion);
          return {
            ...result,
            outputPath: conversion.outputPath,
          };
        },
      });
      dynamicWorkflow.step(convertSourceCode).then(
        new Step({
          id: `writeSourceCodeToWorkspace-${index}`,
          execute: writeCodeFromStep(convertSourceCode.id),
        }),
      );
    });

    // Create parallel steps for each unit test conversion
    inputData.unitTestConversions.forEach((conversion, index) => {
      // TODO: Use Nested Workflow instead
      const id = `convertUnitTest-${index}`;
      const convertUnitTest = new Step({
        id,
        outputSchema: conversionOutputSchema,
        execute: async () => {
          console.log(`${id}: ${conversion.inputFile} > ${conversion.outputPath}`);
          const result = await unitConverter.convert(conversion);
          return {
            ...result,
            outputPath: conversion.outputPath,
          };
        },
      });
      dynamicWorkflow.step(convertUnitTest).then(
        new Step({
          id: `writeUnitTestToWorkspace-${index}`,
          execute: writeCodeFromStep(convertUnitTest.id),
        }),
      );
    });
    // TODO: Evaluate the generated workspace against criteria
    dynamicWorkflow.commit();

    // Create a run and execute the dynamic workflow
    const run = dynamicWorkflow.createRun();
    const dynamicRunResult = await run.start({
      triggerData: inputData,
    });
    // TODO: Detect dynamic workflow failure...
    // Return the results from the dynamic workflow
    return {
      results: dynamicRunResult.results,
    };
  },
});

parentWorkflow.step(createDynamicWorkflow).commit();

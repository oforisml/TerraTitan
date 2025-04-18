import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { input, search } from '@inquirer/prompts';
import { z } from 'zod';
import { mastra } from './mastra/index.js';

const require = createRequire(import.meta.url);
const awsCdkLibPath = path.dirname(require.resolve('aws-cdk-lib/package.json'));
/**
 * All AWS CDK modules in the local aws-cdk-lib package
 */
export const awsCdkModules = (await fs.readdir(awsCdkLibPath)).filter(name => name.startsWith('aws-'));

/**
 * Schema for command line arguments
 */
export const commandLineArgsSchema = z
  .object({
    /**
     * The workflow to run
     */
    workflow: z.string().optional(),
    /**
     * The AWS CDK module to convert
     */
    module: z.string().optional(),
    /**
     * The workspace ID to use for the conversion
     */
    workspace: z.string().optional(),
    /**
     * The output module name
     */
    output: z.string().optional(),
    /**
     * The source file to convert
     * (for cdktf-ref demo)
     */
    sourceFile: z.string().optional(),
    /**
     * The source class to convert
     * (for cdktf-ref demo)
     */
    sourceClass: z.string().optional(),
    /**
     * Flag to list workflows instead of running one
     */
    list: z
      .union([
        z.literal('true').transform(() => true),
        z.literal('false').transform(() => false),
        z.null().transform(() => true),
      ])
      .default('false'),
  })
  .strict();

export type CommandLineArgs = z.infer<typeof commandLineArgsSchema>;

export async function getConversionInputs(args?: CommandLineArgs): Promise<{
  moduleName: string;
  workspaceId: string;
  outputModule: string;
}> {
  const moduleName =
    args?.module ||
    (await search({
      message: 'Enter the AWSCDK module name (e.g., aws-sns):',
      source: async input => {
        if (!input) {
          return [];
        }
        const filteredModules = awsCdkModules.filter(name => name.startsWith(input));
        if (filteredModules.length > 0) {
          return filteredModules.map(name => ({
            name,
            value: name,
            description: `Found in local aws-cdk-lib: ${name}`,
          }));
        }
        return [];
      },
    }));
  const answers = {
    moduleName,
    workspaceId:
      args?.workspace ||
      (await input({
        message: 'Enter the workspace ID (e.g., aws-sns):',
        default: moduleName,
        validate: (input: string) => {
          if (input.length < 1) {
            return 'Workspace ID must be at least 1 character long';
          }
          if (input.length > 20) {
            return 'Workspace ID must be at most 20 characters long';
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Workspace ID must only contain letters, numbers, dashes, and underscores';
          }
          return true;
        },
      })),
    outputModule:
      args?.output ||
      (await input({
        message: 'Enter the output module name (e.g., notify):',
        validate: (input: string) => {
          if (input.length < 1) {
            return 'Module name must be at least 1 character long';
          }
          if (input.length > 20) {
            return 'Module name must be at most 20 characters long';
          }
          if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
            return 'Module name must only contain letters, numbers, dashes, and underscores';
          }
          return true;
        },
      })),
  };

  return answers;
}

// List all workflow runs
export async function listWorkflowRuns() {
  for (const [key, workflow] of Object.entries(mastra.getWorkflows())) {
    // print summary of all workflow runs
    const allRuns = await workflow.getWorkflowRuns();
    const summary = allRuns.runs.map(run => ({
      id: run.runId,
      status: typeof run.snapshot === 'string' ? run.snapshot : run.snapshot.value,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    }));
    console.log(`All ${key} runs:`, JSON.stringify(summary, null, 2));
  }
  // print vnext workflow runs (there's only one)
  const workflow = mastra.vnext_getWorkflow('vNextWorkflow');
  const allRuns = await workflow.getWorkflowRuns();
  const summary = allRuns.runs.map(run => ({
    id: run.runId,
    status: typeof run.snapshot === 'string' ? run.snapshot : run.snapshot.value,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  }));
  console.log(`All vNextWorkflow runs:`, JSON.stringify(summary, null, 2));
  return;
}

import path from 'path';
import fs from 'fs/promises';
import { Mastra } from '@mastra/core';
import { WorkflowContext, Step } from '@mastra/core/workflows';
import { simpleGit, type SimpleGit } from 'simple-git';
import { z } from 'zod';

/**
 * The Workflow workspace
 */
export const workspaceSchema = z.object({
  id: z.string(),
  repositoryUrl: z.string(),
});

/**
 * A step to ensure Workspace exists
 */
export const ensureWorkspace = new Step({
  id: 'ensureWorkspace',
  inputSchema: workspaceSchema,
  outputSchema: z.object({
    targetDir: z.string(),
  }),
  execute: async ({ context }) => {
    // https://mastra.ai/docs/workflows/control-flow#using-variable-mapping
    const { repositoryUrl, id } = context.inputData;
    if (!repositoryUrl || !id) {
      console.log(`Missing repositoryUrl - ${repositoryUrl} or id - ${id}`);
      throw new Error('Repository URL and Workspace ID are required');
    }

    const targetDir = `./workspaces/${id}`;

    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });

    // Check if git is already initialized
    const isGitRepo = await fs
      .access(path.join(targetDir, '.git'))
      .then(() => true)
      .catch(() => false);

    if (!isGitRepo) {
      await simpleGit().clone(repositoryUrl, targetDir);
      console.log(`Cloned repository ${repositoryUrl} into ${targetDir}`);
    } else {
      // confirm remote matches repositoryUrl
      const git: SimpleGit = simpleGit(targetDir);
      const remoteConfig = await git.getConfig('remote.origin.url');
      const remoteUrl = remoteConfig.value;
      if (!remoteUrl || remoteUrl !== repositoryUrl) {
        throw new Error(
          `${targetDir} - Remote URL ${remoteUrl} does not match repository URL ${repositoryUrl}, aborting`,
        );
      }
      console.log(`Repository ${repositoryUrl} already exists in ${targetDir}`);
    }
    // TODO: Run `pnpm install` in workspace...
    return { targetDir };
  },
});

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

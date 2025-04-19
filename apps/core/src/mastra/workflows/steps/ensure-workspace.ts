import path from 'node:path';
import fs from 'node:fs/promises';
import { simpleGit, type SimpleGit } from 'simple-git';
import { z } from 'zod';

/**
 * The input schema for the ensureWorkspace step
 */
export const workspaceInputSchema = z.object({
  /**
   * The Id to create the workspace as
   */
  id: z.string(),
  /**
   * The URL of the repository to use as workspace source
   */
  repositoryUrl: z.string(),
});

/**
 * The output schema for the ensureWorkspace step
 */
export const workspaceOutputSchema = z.object({
  targetDir: z.string(),
});

/**
 * A step to ensure the Conversion Workspace with provided Id exists
 *
 * The workspace is where the converted code will be written to for further processing.
 */
export async function ensureWorkspace(
  input: z.infer<typeof workspaceInputSchema>,
): Promise<z.infer<typeof workspaceOutputSchema>> {
  // https://mastra.ai/docs/workflows/control-flow#using-variable-mapping
  const { repositoryUrl, id } = input;
  if (!repositoryUrl || !id) {
    console.log(`Missing repositoryUrl - ${repositoryUrl} or id - ${id}`);
    throw new Error('Repository URL and Workspace ID are required');
  }

  const targetDir = path.join('workspaces', id);

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
}

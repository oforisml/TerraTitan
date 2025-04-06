import path from 'path';
import fs from 'fs/promises';
import { Mastra } from '@mastra/core';
import { WorkflowContext, Step } from '@mastra/core/workflows';
import { simpleGit, type SimpleGit } from 'simple-git';
import { z } from 'zod';
import { TiktokenModel } from 'tiktoken';

/**
 *  OpenAI's embedding token limit for
 * - 'text-embedding-3-small'
 * - 'text-embedding-3-large'
 */
export const OPENAI_EMBED_MAX_TOKENS = 8191;

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
    // TODO: Run pnpm install in workspace...
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

/**
 * Upstash configuration.
 *
 * Determines the embedding model and dimensions.
 */
export interface UpstashConfig {
  /**
   * The URL of the Upstash vector index
   */
  upstashUrl: string;
  /**
   * The number of dimensions for the embedding model.
   * This is typically 1536 for 'text-embedding-3-small' or 3072 for 'text-embedding-3-large'.
   * @see https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-providers--models
   */
  dimensions: number;
  /**
   * The token for authenticating with the Upstash vector database.
   */
  upstashToken: string | undefined;
  /**
   * The embedding model used for generating embeddings.
   * This is typically 'text-embedding-3-small' or 'text-embedding-3-large'.
   *
   * must match the Upstash index config
   */
  embeddingModel: TiktokenModel;
}

/**
 * Get the pre-configured Upstash configuration for the given index name.
 *
 * Indices must be created upfront and their configuration determines the embedding model and dimensions
 *
 * See .env.example for UPSTASH_TOKEN_xxx configuration
 *
 * pre-created Upstash indexnames for TerraTitan are
 *
 * - 'provider-aws-resources-small'
 * - 'provider-aws-resources-large'
 *
 * @param indexName - The pre-created index on Upstash
 */
export function getUpstashConfig(indexName: string): UpstashConfig {
  if (indexName === 'provider-aws-resources-small') {
    return {
      dimensions: 1536,
      // mastra has built-in support for cohere and openai,
      // may reconsider later based on:
      // https://huggingface.co/spaces/mteb/leaderboard
      embeddingModel: 'text-embedding-3-small',
      upstashUrl: 'https://deep-molly-68135-us1-vector.upstash.io',
      upstashToken: process.env.UPSTASH_TOKEN_SMALL,
    };
  } else if (indexName === 'provider-aws-resources-large') {
    return {
      dimensions: 3072,
      embeddingModel: 'text-embedding-3-large',
      upstashUrl: 'https://pretty-marmot-55613-us1-vector.upstash.io',
      upstashToken: process.env.UPSTASH_TOKEN_LARGE,
    };
  } else {
    throw new Error(`Unknown Upstash index name: ${indexName}`);
  }
}

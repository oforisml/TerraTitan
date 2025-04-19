import path from 'node:path';
import fs from 'node:fs/promises';
import { ZipDownloader } from '../../util/zip-downloader.js';
import { getAwsCdkVersion } from '../../util/helpers.js';
import { z } from 'zod';

/**
 * The input schema for the ensureUpstream step
 */
export const ensureUpstreamInputSchema = z.object({
  /**
   * The module within the aws-cdk-lib to work with
   */
  moduleName: z.string(),
  /**
   * The version of the module to work with
   *
   * @default - automatically detected from dev dependencies
   */
  tag: z.string().optional(),
  /**
   * The Owner of the Repository to clone
   *
   * @default 'aws'
   */
  owner: z.string().optional(),
  /**
   * The Repository to clone
   *
   * @default 'aws-cdk'
   */
  repo: z.string().optional(),
  /**
   * The path to the aws-cdk-lib package within aws-cdk repo
   *
   * @default 'packages/aws-cdk-lib'
   */
  targetDir: z.string().optional(),
  /**
   * Whether to use a cache for the tagged repo archive
   *
   * @default true
   */
  useCache: z.boolean().optional(),
});

/**
 * The output schema for the ensureUpstream step
 */
export const ensureUpstreamOutputSchema = z.object({
  /**
   * The upstream repository
   */
  repo: z.string(),
  /**
   * The tag or branch of the upstream repository
   */
  tag: z.string(),
  /**
   * The module within the aws-cdk-lib to work with
   */
  moduleName: z.string(),
  /**
   * The directory where the upstream code is stored
   */
  upstreamDir: z.string(),
  /**
   * Whether the upstream code was created or already existed
   */
  created: z.boolean(),
});

/**
 * Ensure that the upstream module is available for conversion
 */
export async function ensureUpstream(
  input: z.infer<typeof ensureUpstreamInputSchema>,
): Promise<z.infer<typeof ensureUpstreamOutputSchema>> {
  const version = await getAwsCdkVersion();
  const {
    moduleName,
    owner = 'aws',
    repo = 'aws-cdk',
    targetDir = 'packages/aws-cdk-lib',
    tag = `v${version}`,
    useCache = true,
  } = ensureUpstreamInputSchema.parse(input);

  if (!moduleName) {
    console.log("Missing required AWS CDK moduleName input for 'ensureUpstream' Step");
    throw new Error('AWS CDK Module required');
  }

  const stagingDir = path.join('upstream', repo, tag, targetDir, moduleName);
  const returnValue: z.infer<typeof ensureUpstreamOutputSchema> = {
    repo,
    tag,
    moduleName,
    upstreamDir: stagingDir,
    created: false,
  };

  // Fast‑path: folder already present and non‑empty
  try {
    const stat = await fs.stat(stagingDir);
    if (stat.isDirectory()) {
      const files = await fs.readdir(stagingDir);
      if (files.length > 0) {
        return returnValue;
      }
    }
  } catch {
    /* not present → fall through */
  }
  const downloader = new ZipDownloader();
  await downloader.download({
    owner,
    repo,
    path: path.join(targetDir, moduleName),
    targetDir: stagingDir,
    tag,
    useCache,
  });
  console.log(`Downloaded ${owner}/${repo} at tag "${tag}" to ${stagingDir}`);
  return { ...returnValue, created: true };
}

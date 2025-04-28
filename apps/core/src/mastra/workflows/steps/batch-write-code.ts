import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { workspaceOutputSchema } from './ensure-workspace.js';
import { Sema } from 'async-sema';

// result from sourceConverter & unitConverter agent(s)
export const batchWriteCodeInputSchema = z.array(
  z.object({
    /**
     * The inputFile information
     */
    inputFile: z.string(),
    /**
     * The run the conversion into
     */
    workspace: workspaceOutputSchema,
    /**
     * Path Infix to use for the output file
     */
    infixPath: z.string(),
    /**
     * The output module to write to within the Workspace
     */
    outputModule: z.string(),
    /**
     * The converted code to write to the workspace outputModule
     * - This is the result of the sourceConverter or unitConverter agent
     * - The code is written to the outputPath
     * - The outputPath is the inputFile path within the workspace outputModule
     */
    code: z.string(),
  }),
);

/**
 * A step to write a Batch of conversions from AWS CDK to TerraConstructs
 *
 * Writes converted code to the workspace outputModule while handling name conflicts
 */
export async function batchWriteCode(writeRequests: z.infer<typeof batchWriteCodeInputSchema>) {
  // 2) Create a semaphore allowing 10 concurrent jobs
  const sema = new Sema(10);
  return Promise.all(
    writeRequests.map(async ({ inputFile, code, workspace, infixPath, outputModule }) => {
      await sema.acquire();
      try {
        const outputDir = path.join(workspace.targetDir, infixPath, outputModule);
        // Create target directory if it doesn't exist
        await fs.mkdir(outputDir, { recursive: true });
        const targetFile = path.join(outputDir, path.basename(inputFile));
        return await writeWithoutConflict(targetFile, code);
      } finally {
        sema.release();
      }
    }),
  );
}

/**
 * If the target file exists, write to timestamped name; otherwise just write to targetFile.
 */
async function writeWithoutConflict(targetFile: string, code: string): Promise<string> {
  try {
    // Check if file exists
    await fs.access(targetFile);
    // File exists, create timestamped version for new content
    const { dir, name, ext } = path.parse(targetFile);
    const newFile = path.join(dir, `${name}-${Date.now()}${ext}`);
    console.log(`[batchWriteCode] Conflict ➞ Writing new content to ${newFile}`);
    await fs.writeFile(newFile, code);
    return newFile;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, write directly
      await fs.writeFile(targetFile, code);
      return targetFile;
    } else {
      throw err;
    }
  }
}

import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ensureUpstreamOutputSchema } from './ensure-upstream.js';
import { findGeneratedImports } from '../../util/helpers.js';

/**
 * A single Conversion request
 */
export const inputSchema = z.object({
  /**
   * The input file to convert
   */
  inputFile: z.string(),
  // inputRefFiles: z.array(z.string()),
  /**
   * The input references
   * This includes L1 Cfn Resources an inputFile depends on
   */
  inputRefs: z.array(
    z.object({
      /**
       * The source file of the L1 Cfn Resource
       */
      sourceFile: z.string(),
      /**
       * The source class of the L1 Cfn Resource
       */
      sourceClass: z.string(),
    }),
  ),
  // outputRefFiles: z.array(z.string()),
  // outputRefs: z.array(
  //   z.object({
  //     sourceFile: z.string(),
  //     sourceClass: z.string(),
  //   }),
  // ),
});

export enum InputRefType {
  /**
   * The input file is a source file
   */
  LIB = 'lib',
  /**
   * The input file is a test file
   */
  TEST = 'test',
}

/**
 * The output schema for the findInputRefs step
 *
 * These are the input files and their input references
 */
export const findInputRefsOutputSchema = z.object({
  /**
   * Information about the input files for conversion
   * This includes the input file, the input references
   */
  inputFiles: z.array(inputSchema),
  /**
   * The raw files that were found
   */
  rawFiles: z.array(z.string()),
});

/**
 * Find all the input files and their references in the upstream directory
 *
 * For source code files, this will be the:
 * - Cfn L1 Resource Class
 * - Cfn L1 Resource Class Source File
 *
 * For test files, this will be the:
 * - the source File(s) under test
 *
 * @param upstreamDetails The upstream details
 * @param type (default LIB) The type of input references to find
 * @returns The input files and their input references
 */
export async function findInputRefs(
  upstreamDetails: z.infer<typeof ensureUpstreamOutputSchema>,
  type: InputRefType = InputRefType.LIB,
): Promise<z.infer<typeof findInputRefsOutputSchema>> {
  const require = createRequire(import.meta.url);

  // TODO: Handle Unit Test and Source Code files differently
  const srcDir = path.join(upstreamDetails.upstreamDir, type);
  const inputFiles: z.infer<typeof inputSchema>[] = [];
  const rawFiles: string[] = [];
  for (const file of await getAllFiles(srcDir)) {
    if (file.endsWith('.ts')) {
      const generatedImports = findGeneratedImports(await fs.readFile(file, 'utf-8'));
      if (Object.keys(generatedImports).length === 0) {
        rawFiles.push(file);
        continue;
      }
      const inputRefs = [];
      for (const [baseName, sourceClasses] of Object.entries(generatedImports)) {
        if (sourceClasses.length === 0) {
          rawFiles.push(file);
          continue;
        }
        // node_modules/aws-cdk-lib/<aws-zzz>/index.js
        const moduleDistIndex = require.resolve(path.join('aws-cdk-lib', upstreamDetails.moduleName));
        // file: <upstreamDir>/lib/foo/bar.ts, baseName: ../zzz -> <upstreamDir>/lib/zzz
        const relPath = path.join(path.dirname(file), baseName);
        // <upstreamDir>/lib/zzz -> lib/zzz
        const relPathWithoutUpstream = relPath.replace(upstreamDetails.upstreamDir, '');
        const sourceFile = path.join(path.dirname(moduleDistIndex), relPathWithoutUpstream + '.d.ts');
        // Warn if sourceFile does not exist in installed aws-cdk-lib
        try {
          await fs.stat(sourceFile);
        } catch (err) {
          console.warn('Source file does not exist in aws-cdk-lib:', sourceFile);
        }
        inputRefs.push(
          ...sourceClasses.map(sourceClass => ({
            sourceFile,
            sourceClass,
          })),
        );
      }
      inputFiles.push({
        inputFile: file,
        inputRefs,
      });
    }
  }
  return {
    inputFiles,
    rawFiles,
  };
}

// Helper function to recursively walk directory
async function getAllFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
    }),
  );
  return files.flat();
}

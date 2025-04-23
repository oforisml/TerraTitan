import { createRequire } from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { ensureUpstreamOutputSchema } from './ensure-upstream.js';
import { findGeneratedImports, findAwsCdkDeclarations } from '../../util/helpers.js';

/**
 * A single Unit Test Code Conversion input
 */
export const testInputSchema = z.object({
  /**
   * The input file to convert
   */
  inputFile: z.string(),
  /**
   * The input references (i.e. declaration files of the library under test)
   */
  inputRefs: z.array(z.string()),
});

/**
 * The output schema for the findInputRefs step
 *
 * These are the input files and their input references
 */
export const findTestInputRefsOutputSchema = z.object({
  /**
   * Information about the input files for conversion
   * This includes the input file and its input references
   */
  inputFiles: z.array(testInputSchema),
});

/**
 * Find all the input files and their references in upstream lib
 *
 * For test files:
 * - the source File(s) declarations under test
 *
 * @param upstreamDetails The upstream details
 * @returns The input files and their input references
 */
export async function findTestInputRefs(
  upstreamDetails: z.infer<typeof ensureUpstreamOutputSchema>,
): Promise<z.infer<typeof findTestInputRefsOutputSchema>> {
  const testDir = path.join(upstreamDetails.upstreamDir, 'test');
  const testFiles = await getAllFiles(testDir);
  return {
    inputFiles: testFiles.map(testFile => ({
      inputFile: testFile,
      // TODO: Filter on what's actually used 'testFile'?
      inputRefs: findAwsCdkDeclarations(upstreamDetails.moduleName),
    })),
  };
}

/**
 * A single Source Code Conversion input
 */
export const srcInputSchema = z.object({
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
});

/**
 * The output schema for the findInputRefs step
 *
 * These are the input files and their input references
 */
export const findSrcInputRefsOutputSchema = z.object({
  /**
   * Information about the input files for conversion
   * This includes the input file, the input references
   */
  inputFiles: z.array(srcInputSchema),
  /**
   * The raw files that were found
   */
  rawFiles: z.array(z.string()),
});

/**
 * Find all the input files and their references in the upstream directory
 *
 * For source code files:
 * - Cfn L1 Resource Class
 * - Cfn L1 Resource Class Source File
 *
 * @param upstreamDetails The upstream details
 * @returns The input files and their input references
 */
export async function findSrcInputRefs(
  upstreamDetails: z.infer<typeof ensureUpstreamOutputSchema>,
): Promise<z.infer<typeof findSrcInputRefsOutputSchema>> {
  const require = createRequire(import.meta.url);
  const srcDir = path.join(upstreamDetails.upstreamDir, 'src');

  const inputFiles: z.infer<typeof srcInputSchema>[] = [];
  const rawFiles: string[] = [];
  for (const file of await getAllFiles(srcDir)) {
    if (file.endsWith('.ts') && file !== 'index.ts') {
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
  // TODO: Consider using tts.sys.readDirectory instead?
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? getAllFiles(fullPath) : fullPath;
    }),
  );
  return files.flat();
}

import { mastra } from './mastra/index.js';
import z from 'zod';
import { triggerSchema } from './mastra/workflows/poc-batch-test-convert.js';

export async function runBatchTestConvertWf() {
  const wf = mastra.getWorkflow('batchTestConversionWorkflow');
  const run = wf.createRun();
  const moduleName = 'aws-sns';
  const cacheFile = `cache-${moduleName}.json`;
  const triggerData: z.infer<typeof triggerSchema> = {
    cacheFile,
    moduleName,
    upstreamDir: '/home/vincent/tcons/TerraTitan/apps/core/upstream/aws-cdk/v2.186.0/packages/aws-cdk-lib/aws-sns',
  };
  console.log('Running Batch Test Conversion workflow...');
  const result = await run.start({ triggerData });
  console.log('Final output:', JSON.stringify(result.results, null, 2));
  return result;
}

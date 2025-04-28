import { mastra } from './mastra/index.js';
import z from 'zod';
import { triggerSchema } from './mastra/workflows/poc-batch-test-convert.js';

export async function runBatchTestConvertWf() {
  const wf = mastra.getWorkflow('batchTestConversionWorkflow');
  const logger = mastra.getLogger();
  const run = wf.createRun();
  const moduleName = 'aws-sns';
  const cacheFile = `cache-${moduleName}.json`;
  const triggerData: z.infer<typeof triggerSchema> = {
    cacheFile,
    moduleName,
    upstreamDir: '/home/vincent/tcons/TerraTitan/apps/core/upstream/aws-cdk/v2.186.0/packages/aws-cdk-lib/aws-sns',
  };
  logger.info('Running Batch Test Conversion workflow...');
  const result = await run.start({ triggerData });
  logger.info(`Final output ${JSON.stringify(result.results, null, 2)}`);
  return result;
}

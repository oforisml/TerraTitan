import { mastra } from './mastra/index.js';

export async function runBatchSourceConvertWf() {
  const wf = mastra.getWorkflow('batchConversionWorkflow');
  const logger = mastra.getLogger();
  const run = wf.createRun();
  const cacheFile = `cache-aws-sns.json`;
  logger.info('Running Ensure Batch Source Conversion workflow...');
  const result = await run.start({ triggerData: { cacheFile } });
  logger.info(`Final output ${JSON.stringify(result.results, null, 2)}`);
  return result;
}

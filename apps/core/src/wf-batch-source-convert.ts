import { mastra } from './mastra/index.js';

export async function runBatchSourceConvertWf() {
  const wf = mastra.getWorkflow('batchConversionWorkflow');
  const run = wf.createRun();
  const cacheFile = `cache-aws-sns.json`;
  console.log('Running Ensure Batch Source Conversion workflow...');
  const result = await run.start({ triggerData: { cacheFile } });
  console.log('Final output:', JSON.stringify(result.results, null, 2));
  return result;
}

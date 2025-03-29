import path from 'path';
import { mastra } from './mastra/index.js';
import { gitRoot } from './mastra/util/helpers.js';

// TODO: Figure out why this is needed because Mastra should do this automatically...
import dotenv from 'dotenv';
dotenv.config();

// path from git root to aws-cdk-lib source files to be converted
// TODO: Point to GH Archive download from aws-cdk repository,...
const awsCdkSrcDir = path.join(gitRoot, 'data', 'samples');

// path from git root to aws-cdk-lib package (for the d.ts declaration files)
// TODO: Point to require.resolve("aws-cdk-lib")
const awsCdkPkgDir = path.join(gitRoot, 'data', 'reference', 'declarations', 'aws-cdk-lib');

// path to the CDKTF provider-aws declaration files merged with TS docs for the AWS provider
// see: scripts/merge-docs/index.ts
// TODO: Use workflow steps to prepare merged docs
const mergedAwsDocs = path.join(gitRoot, 'data', 'reference', 'merged', 'provider-aws');

async function main() {
  const workflow = mastra.getWorkflow('sourceConversionWorkflow');
  const { runId, start } = workflow.createRun();
  console.log('Run ID:', runId);

  const runResult = await start({
    triggerData: {
      // TODO: Use correct path to the aws-cdk-lib source files
      inputFile: path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'src', 'topic.ts'),
      inputRefFiles: [path.join(awsCdkPkgDir, 'aws-sns', 'lib', 'sns.generated.d.ts')],
      outputRefFiles: [
        // Note: pre-created through data/scripts/merge-docs/index.ts
        path.join(mergedAwsDocs, 'sns-topic', 'index.d.ts'),
        path.join(mergedAwsDocs, 'sns-topic-data-protection-policy', 'index.d.ts'),
        path.join(mergedAwsDocs, 'sns-topic-policy', 'index.d.ts'),
        path.join(mergedAwsDocs, 'sns-topic-subscription', 'index.d.ts'),
      ],
    },
  });

  console.log('Final output:', runResult.results);
}

main();

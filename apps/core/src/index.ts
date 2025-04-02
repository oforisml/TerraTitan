import path from 'path';
import { mastra } from './mastra/index.js';
import { gitRoot } from './mastra/util/helpers.js';
import { type TriggerType } from './mastra/workflows/parent.js';

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

// TODO: Use workflow steps to fetch markdown docs
const tsAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'typescript', 'provider-aws', 'r');

async function main() {
  const parentWorkflow = mastra.getWorkflow('parentWorkflow');
  const triggerData: TriggerType = {
    workspace: {
      id: 'aws-sns',
      repositoryUrl: 'https://github.com/TerraConstructs/base.git',
    },
    sourceCodeConversions: [
      {
        // TODO: Use correct path to the aws-cdk-lib source files (currently this is under samples)
        inputFile: path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'src', 'topic.ts'),
        inputRefFiles: [path.join(awsCdkPkgDir, 'aws-sns', 'lib', 'sns.generated.d.ts')],
        outputRefFiles: [
          // Note: pre-created through data/scripts/merge-docs/index.ts
          path.join(mergedAwsDocs, 'sns-topic', 'index.d.ts'),
          path.join(mergedAwsDocs, 'sns-topic-data-protection-policy', 'index.d.ts'),
          path.join(mergedAwsDocs, 'sns-topic-policy', 'index.d.ts'),
          path.join(mergedAwsDocs, 'sns-topic-subscription', 'index.d.ts'),
        ],
        outputPath: path.join('src', 'aws', 'notify', 'topic.ts'),
      },
    ],
    unitTestConversions: [
      {
        // TODO: Use correct path to the aws-cdk-lib source files (currently this is under samples)
        inputFile: path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'test', 'sns.test.ts'),
        inputRefFiles: [
          // TODO: Use correct path to the aws-cdk-lib Pkg files (currently this is under samples)
          path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'declarations', 'topic.d.ts'),
          path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'declarations', 'topic-base.d.ts'),
          path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'declarations', 'policy.d.ts'),
        ],
        outputRefFiles: [
          path.join(tsAwsDocs, 'sns_topic.html.markdown'),
          path.join(tsAwsDocs, 'sns_topic_policy.html.markdown'),
          path.join(tsAwsDocs, 'sns_topic_data_protection_policy.html.markdown'),
        ],
        outputPath: path.join('test', 'aws', 'notify', 'sns.test.ts'),
      },
    ],
  };

  // Trigger the parent workflow with the trigger data
  const { runId, start } = parentWorkflow.createRun();
  console.log('Run ID:', runId);
  const runResult = await start({ triggerData });
  console.log('Final output:', JSON.stringify(runResult.results, null, 2));
}

main();

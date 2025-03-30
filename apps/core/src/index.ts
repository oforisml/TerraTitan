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

// TODO: Use workflow steps to fetch markdown docs
const tsAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'typescript', 'provider-aws', 'r');

async function main() {
  // // Sample Source Code conversion invocation
  // const sourceConversionWorkflow = mastra.getWorkflow('sourceConversionWorkflow');
  // const { runId: sourceRunId, start: startSourceConversion } = sourceConversionWorkflow.createRun();
  // console.log('Run ID:', sourceRunId);

  // const sourceConversionRunResult = await startSourceConversion({
  //   triggerData: {
  //     // TODO: Use correct path to the aws-cdk-lib source files (currently this is under samples)
  //     inputFile: path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'src', 'topic.ts'),
  //     inputRefFiles: [path.join(awsCdkPkgDir, 'aws-sns', 'lib', 'sns.generated.d.ts')],
  //     outputRefFiles: [
  //       // Note: pre-created through data/scripts/merge-docs/index.ts
  //       path.join(mergedAwsDocs, 'sns-topic', 'index.d.ts'),
  //       path.join(mergedAwsDocs, 'sns-topic-data-protection-policy', 'index.d.ts'),
  //       path.join(mergedAwsDocs, 'sns-topic-policy', 'index.d.ts'),
  //       path.join(mergedAwsDocs, 'sns-topic-subscription', 'index.d.ts'),
  //     ],
  //   },
  // });

  // console.log('Final output:', sourceConversionRunResult.results);

  // Sample Unit Tests conversion invocation
  const unitConversionWorkflow = mastra.getWorkflow('unitConversionWorkflow');
  const { runId: unitRunId, start: startUnitConversion } = unitConversionWorkflow.createRun();
  console.log('Run ID:', unitRunId);

  const unitConversionRunResult = await startUnitConversion({
    triggerData: {
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
    },
  });

  console.log('Final output:', unitConversionRunResult.results);
}

main();

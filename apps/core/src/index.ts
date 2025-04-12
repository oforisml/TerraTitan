import path from 'path';
import { select, checkbox } from '@inquirer/prompts';
import { mastra } from './mastra/index.js';
import { gitRoot } from './mastra/util/helpers.js';
import { type TriggerType as ConvertTriggertype } from './mastra/workflows/parent.js';
import {
  TriggerType as RefTriggerType,
  RAGReviewType,
  RerankedResultType,
  RAGReviewDecisionType,
} from './mastra/workflows/ref-wf.js';

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

/**
 * Demo conversion workflow
 * This workflow converts a CDK source file to a CDKTF source file.
 */
async function runConvertWf() {
  const parentWorkflow = mastra.getWorkflow('parentWorkflow');
  const triggerData: ConvertTriggertype = {
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

  console.log('Running Demo Conversion workflow...');
  // Trigger the parent workflow with the trigger data
  const { runId, start } = parentWorkflow.createRun();
  console.log('Run ID:', runId);
  const runResult = await start({ triggerData });
  console.log('Final output:', JSON.stringify(runResult.results, null, 2));
}

/**
 * CDKTF Reference retrieval workflow
 * This workflow retrieves CDKTF references for a given AWSCDK source file and class.
 */
async function runCdktfRefWf() {
  const wf = mastra.getWorkflow('cdktfRefWorkflow');
  const run = wf.createRun();
  const triggerData: RefTriggerType = {
    sourceFile: path.join(awsCdkPkgDir, 'aws-elasticloadbalancingv2', 'lib', 'elasticloadbalancingv2.generated.d.ts'),
    sourceClass: 'CfnTargetGroup',
  };

  // Start the workflow with content that needs review
  console.log('Running CDKTF Reference retrieval workflow...');
  const result = await run.start({ triggerData });

  const reviewStep = result.activePaths.get('reviewCdktfReferences');
  // Check if workflow is suspended
  if (reviewStep?.status === 'suspended') {
    const { sourceFile, sourceClass, rerankedResults, message } = reviewStep?.suspendPayload as RAGReviewType;

    console.log('\n===================================');
    console.log(message);
    console.log('===================================\n');

    // Let the agent select which products to recommend
    const approvedReferences = await checkbox({
      message: 'Relevant CDKTF provider-aws resources',
      choices: rerankedResults.map((ranked: RerankedResultType) => ({
        name: `${ranked.id} (Reranked Score: ${ranked.rerankedScore.toFixed(2)} - Original Score: ${ranked.originalScore.toFixed(2)})`,
        value: ranked.id,
        checked: ranked.rerankedScore > 0.5,
      })),
    });

    // TODO: Ability to modify the score (re-order)?

    // filter out the selected references
    const selectedReferences = rerankedResults.filter((ranked: RerankedResultType) =>
      approvedReferences.includes(ranked.id),
    );

    // Resume the workflow after Human review
    const resumeInput: RAGReviewDecisionType = {
      sourceFile,
      sourceClass,
      rerankedResults: selectedReferences,
    };
    const resumeResult = await run.resume({
      stepId: 'reviewCdktfReferences',
      context: resumeInput,
    });

    if (resumeResult?.results?.reviewCdktfReferences?.status === 'success') {
      console.log('\n===================================');
      console.log('CDKTF Reference Selection complete');
      console.log('===================================\n');

      if (resumeResult?.results?.reviewCdktfReferences?.output.rerankedResults) {
        console.log('Final References:');
        console.log(resumeResult?.results?.reviewCdktfReferences?.output.rerankedResults);
      }
    }

    return resumeResult;
  }

  if (result.results?.reviewCdktfReferences?.status && result.results.reviewCdktfReferences.status === 'success') {
    console.log(
      'Workflow completed without requiring human intervention:',
      result.results?.reviewCdktfReferences?.output.rerankedResults,
    );
  } else {
    console.log('Workflow completed without requiring human intervention:', result.results);
  }
  return result;
}

async function main() {
  console.log('>>>TerraTitan CLI - PoC<<<');
  const wfToRun = await select<'convert' | 'cdktfRef'>({
    message: 'Select which workflow to run:',
    choices: [
      { name: 'Demo Conversion', value: 'convert' },
      { name: 'CDKTF Reference retrieval', value: 'cdktfRef' },
    ],
  });
  switch (wfToRun) {
    case 'convert':
      await runConvertWf();
      break;
    case 'cdktfRef':
      await runCdktfRefWf();
      break;
    default:
      console.log('Invalid workflow selected.');
      break;
  }

  for (const [key, workflow] of Object.entries(mastra.getWorkflows())) {
    // print summary of all workflow runs
    const allRuns = await workflow.getWorkflowRuns();
    const summary = allRuns.runs.map(run => ({
      id: run.runId,
      status: typeof run.snapshot === 'string' ? run.snapshot : run.snapshot.value,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    }));
    console.log(`All ${key} runs:`, JSON.stringify(summary, null, 2));
  }
}

main().catch(console.error);

import path from 'node:path';
import { checkbox } from '@inquirer/prompts';
import { mastra } from './mastra/index.js';
import { gitRoot } from './mastra/util/helpers.js';
import {
  TriggerType as RefTriggerType,
  RAGReviewType,
  RerankedResultType,
  RAGReviewDecisionType,
} from './mastra/workflows/poc-cdktf-ref.js';

// // path from git root to aws-cdk-lib source files to be converted
// // TODO: Point to GH Archive download from aws-cdk repository,...
// const awsCdkSrcDir = path.join(gitRoot, 'data', 'samples');

// path from git root to aws-cdk-lib package (for the d.ts declaration files)
// TODO: Point to require.resolve("aws-cdk-lib")
const awsCdkPkgDir = path.join(gitRoot, 'data', 'reference', 'declarations', 'aws-cdk-lib');

// // path to the CDKTF provider-aws declaration files merged with TS docs for the AWS provider
// // see: scripts/merge-docs/index.ts
// // TODO: Use workflow steps to prepare merged docs
// const mergedAwsDocs = path.join(gitRoot, 'data', 'reference', 'merged', 'provider-aws');

// // TODO: Use workflow steps to fetch markdown docs
// const tsAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'typescript', 'provider-aws', 'r');

/**
 * CDKTF Reference retrieval workflow
 * This workflow retrieves CDKTF references for a given AWSCDK source file and class.
 */
export async function runCdktfRefWf() {
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

    // Let human select which references are relevant
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

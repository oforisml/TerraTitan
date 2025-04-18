import groupCheckbox from 'inquire-grouped-checkbox';
import { mastra } from './mastra/index.js';
import { reviewPayloadSchema as cdktfRefReviewPayloadSchema } from './mastra/workflows/steps/batch-cdktf-ref-rag.js';
import { reviewCdktfRefsStep, type InitType } from './mastra/workflows/vnext.js';
import { CommandLineArgs, getConversionInputs } from './cli-util.js';

export async function runvNextWf(args?: CommandLineArgs) {
  const { moduleName, workspaceId, outputModule } = await getConversionInputs(args);
  // init the workflow
  const inputData: InitType = {
    upstreamModule: {
      moduleName,
    },
    workspace: {
      id: workspaceId,
      repositoryUrl: 'https://github.com/TerraConstructs/base.git',
    },
    outputModule,
  };

  const run = mastra.vnext_getWorkflow('vNextWorkflow').createRun();

  // Add a watcher to monitor execution
  run.watch(event => {
    // if (event.payload.currentStep.id === 'find-upstream-input-refs.review-cdktf-refs') {
    console.log(`Event: Step ${event.payload.currentStep.id} - ${event.payload.currentStep.status}`);
    // if (event.payload.currentStep.status === 'failed') {
    console.log('  Output:', event.payload.currentStep.output);
    console.log('  Payload:', event.payload.currentStep.payload);
    // }
    // }
  });

  const runResult = await run.start({
    inputData,
  });

  const reviewCdktfRefsStepRun = runResult.steps.reviewCdktfRefsStep;
  if (reviewCdktfRefsStepRun?.status === 'suspended') {
    const { groupedChoices, message } = cdktfRefReviewPayloadSchema.parse(reviewCdktfRefsStepRun.payload);
    console.log('\n===================================');
    console.log(message);
    console.log('===================================\n');
    const selectedReferences = await groupCheckbox({
      message: 'Select relevant CDKTF references',
      choices: groupedChoices,
      loop: false,
      required: true,
    });
    // After getting user input
    const resumeResult = await run.resume({
      step: reviewCdktfRefsStep,
      resumeData: selectedReferences,
    });
    console.log('Resume output:', JSON.stringify(resumeResult.result, null, 2));
  }

  console.log('Final output:', JSON.stringify(runResult.result, null, 2));
}

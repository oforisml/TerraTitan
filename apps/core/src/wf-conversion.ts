import fs from 'fs';
import groupCheckbox from 'inquire-grouped-checkbox';
import { mastra } from './mastra/index.js';
import { reviewPayloadSchema as cdktfRefReviewPayloadSchema } from './mastra/workflows/steps/batch-cdktf-ref-rag.js';
import type { CdktfRefReviewResumeType, TriggerDataType } from './mastra/workflows/conversion.js';
import { CommandLineArgs, getConversionInputs } from './cli-util.js';

/**
 * Conversion workflow
 * This workflow converts an AWS CDK Module into a TerraConstructs Workspace
 */
export async function runConversionWorkflow(args?: CommandLineArgs) {
  const { moduleName, workspaceId, outputModule } = await getConversionInputs(args);
  // init the workflow
  const triggerData: TriggerDataType = {
    upstreamModule: {
      moduleName,
    },
    workspace: {
      id: workspaceId,
      repositoryUrl: 'https://github.com/TerraConstructs/base.git',
    },
    outputModule,
  };

  const { start, watch, resume } = mastra.getWorkflow('conversionWorkflow').createRun();
  const cdktfReviewStepId = 'review-cdktf-refs';
  watch(async ({ activePaths }) => {
    if (activePaths.get(cdktfReviewStepId)?.status === 'suspended') {
      const { groupedChoices, message } = cdktfRefReviewPayloadSchema.parse(
        activePaths.get(cdktfReviewStepId)?.suspendPayload,
      );
      // Human review
      console.log('\n===================================');
      console.log(message);
      console.log('===================================\n');
      const selectedReferences = await groupCheckbox({
        message: 'Select relevant CDKTF references',
        choices: groupedChoices,
        loop: false,
        required: true,
      });
      const resumeInput: CdktfRefReviewResumeType = { selectedReferences };
      const resumeResult = await resume({
        stepId: cdktfReviewStepId,
        context: resumeInput,
      });
      if (resumeResult?.results[cdktfReviewStepId]?.status === 'success') {
        console.log('\n===================================');
        console.log('CDKTF Reference Selection complete');
        console.log('===================================\n');

        if (resumeResult?.results[cdktfReviewStepId]?.output) {
          // write to disk
          const filePath = `cache-${moduleName}.json`;
          fs.writeFileSync(
            `cache-${moduleName}.json`,
            JSON.stringify(resumeResult?.results[cdktfReviewStepId]?.output, null, 2),
          );
          console.log(`File written to ${filePath}`);
        }
      }
    }
  });

  await start({
    triggerData,
  });
}

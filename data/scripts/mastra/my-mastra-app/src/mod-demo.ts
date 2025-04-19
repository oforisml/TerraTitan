import { mastra } from "./mastra";
import { TriggerType, ModeratorReviewType, ModeratorDecisionType } from './mastra/workflows/mod-demo';
import { input, select } from '@inquirer/prompts';

// Example of using the workflow with Inquirer prompts
async function runModerationDemo() {
  const registeredWorkflow = mastra.getWorkflow('contentModerationWorkflow');
  const run = registeredWorkflow.createRun();
  const triggerData: TriggerType = {
    content: 'This is some user-generated content that requires moderation.',
  };

  // Start the workflow with content that needs review
  console.log('Starting content moderation workflow...');
  const result = await run.start({ triggerData });

  const isReviewStepSuspended = result.activePaths.get('moderateContent')?.status === 'suspended';

  // Check if workflow is suspended
  if (isReviewStepSuspended) {
    const { content, aiAnalysisScore, flaggedCategories, message } = result.activePaths.get('moderateContent')?.suspendPayload as ModeratorReviewType;

    console.log('\n===================================');
    console.log(message);
    console.log('===================================\n');

    console.log('Content to review:');
    console.log(content);
    console.log(`\nAI Analysis Score: ${aiAnalysisScore}`);
    console.log(`Flagged Categories: ${flaggedCategories?.join(', ') || 'None'}\n`);

    // Collect moderator decision using Inquirer
    const moderatorDecision = await select<'approve' | 'reject' | 'modify'>({
      message: 'Select your moderation decision:',
      choices: [
        { name: 'Approve content as is', value: 'approve' },
        { name: 'Reject content completely', value: 'reject' },
        { name: 'Modify content before publishing', value: 'modify' }
      ],
    });

    // Collect additional information based on decision
    let moderatorNotes = '';
    let modifiedContent = '';

    moderatorNotes = await input({
      message: 'Enter any notes about your decision:',
    });

    if (moderatorDecision === 'modify') {
      modifiedContent = await input({
        message: 'Enter the modified content:',
        default: content,
      });
    }

    console.log('\nSubmitting your moderation decision...');

    // Resume the workflow with the moderator's input
    const resumeInput: ModeratorDecisionType = {
      moderatorDecision,
      moderatorNotes,
      modifiedContent,
    };
    const resumeResult = await run.resume({
      stepId: 'moderateContent',
      context: resumeInput,
    });

    if (resumeResult?.results?.applyModeration?.status === 'success') {
      console.log('\n===================================');
      console.log(`Moderation complete: ${resumeResult?.results?.applyModeration?.output.finalStatus}`);
      console.log('===================================\n');

      if (resumeResult?.results?.applyModeration?.output.content) {
        console.log('Published content:');
        console.log(resumeResult.results.applyModeration.output.content);
      }
    }

    return resumeResult;
  }

  console.log('Workflow completed without requiring human intervention:', result.results);
  return result;
}

// Invoke the demo function
runModerationDemo().catch(console.error);

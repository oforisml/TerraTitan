import { mastra } from "./mastra";
import { TriggerType, ProductType } from './mastra/workflows/human-in-the-loop';
import { confirm, input, checkbox } from '@inquirer/prompts';

async function runRecommendationWorkflow() {
  const registeredWorkflow = mastra.getWorkflow('recommendationWorkflow');
  const run = registeredWorkflow.createRun();

  const triggerData: TriggerType = {
    customerName: 'Jane Smith',
  };

  console.log('Starting product recommendation workflow...');
  const result = await run.start({
    triggerData,
  });

  const isReviewStepSuspended = result.activePaths.get('reviewRecommendations')?.status === 'suspended';

  // Check if workflow is suspended for human review
  if (isReviewStepSuspended) {
    const { customerName, recommendations, message } = result.activePaths.get('reviewRecommendations')?.suspendPayload;

    console.log('\n===================================');
    console.log(message);
    console.log(`Customer: ${customerName}`);
    console.log('===================================\n');

    // Use Inquirer to collect input from the sales agent in the terminal
    console.log('Available product recommendations:');
    recommendations.forEach((product: ProductType, index: number) => {
      console.log(`${index + 1}. ${product.productName} - $${product.price.toFixed(2)}`);
      console.log(`   ${product.description}\n`);
    });

    // Let the agent select which products to recommend
    const approvedProducts = await checkbox({
      message: 'Select products to recommend to the customer:',
      choices: recommendations.map((product: ProductType) => ({
        name: `${product.productName} ($${product.price.toFixed(2)})`,
        value: product.productId,
      })),
    });

    // Let the agent add a personal note
    const includeNote = await confirm({
      message: 'Would you like to add a personal note?',
      default: false,
    });

    let customerNote = '';
    if (includeNote) {
      customerNote = await input({
        message: 'Enter your personalized note for the customer:',
      });
    }

    // Ask if a discount should be offered
    const offerDiscount = await confirm({
      message: 'Offer a 10% discount to this customer?',
      default: false,
    });

    console.log('\nSubmitting your review...');

    // Resume the workflow with the agent's input
    const resumeResult = await run.resume({
      stepId: 'reviewRecommendations',
      context: {
        approvedProducts,
        customerNote,
        offerDiscount,
      },
    });

    console.log('\n===================================');
    console.log('Workflow completed!');
    console.log('Email content:');
    console.log('===================================\n');
    console.log(resumeResult?.results?.sendRecommendations || 'No email content generated');

    return resumeResult;
  }

  return result;
}

// Invoke the workflow with interactive terminal input
runRecommendationWorkflow().catch(console.error);

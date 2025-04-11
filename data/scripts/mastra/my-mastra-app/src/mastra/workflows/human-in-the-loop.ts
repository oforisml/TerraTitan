import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";

const triggerSchema = z.object({
  customerName: z.string(),
});

const productSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  price: z.number(),
  description: z.string(),
});

export type TriggerType = z.infer<typeof triggerSchema>;
export type ProductType = z.infer<typeof productSchema>;

// Step 1: Generate product recommendations
const generateRecommendations = new Step({
  id: 'generateRecommendations',
  outputSchema: z.object({
    customerName: z.string(),
    recommendations: z.array(
      productSchema,
    ),
  }),
  execute: async ({ context }) => {
    const customerName = context.triggerData.customerName;

    // In a real application, you might call an API or ML model here
    // For this example, we'll return mock data
    return {
      customerName,
      recommendations: [
        {
          productId: 'prod-001',
          productName: 'Premium Widget',
          price: 99.99,
          description: 'Our best-selling premium widget with advanced features',
        },
        {
          productId: 'prod-002',
          productName: 'Basic Widget',
          price: 49.99,
          description: 'Affordable entry-level widget for beginners',
        },
        {
          productId: 'prod-003',
          productName: 'Widget Pro Plus',
          price: 149.99,
          description: 'Professional-grade widget with extended warranty',
        },
      ],
    };
  },
});

// Step 2: Get human approval and customization for the recommendations
const reviewRecommendations = new Step({
  id: 'reviewRecommendations',
  inputSchema: z.object({
    approvedProducts: z.array(z.string()),
    customerNote: z.string().optional(),
    offerDiscount: z.boolean().optional(),
  }),
  outputSchema: z.object({
    finalRecommendations: z.array(
      z.object({
        productId: z.string(),
        productName: z.string(),
        price: z.number(),
      }),
    ),
    customerNote: z.string().optional(),
    offerDiscount: z.boolean(),
  }),
  execute: async ({ context, suspend }) => {
    const { customerName, recommendations } = context.getStepResult(generateRecommendations) || {
      customerName: '',
      recommendations: [],
    };

    // Check if we have input from a resumed workflow
    const reviewInput = {
      approvedProducts: context.inputData?.approvedProducts || [],
      customerNote: context.inputData?.customerNote,
      offerDiscount: context.inputData?.offerDiscount,
    };

    // If we don't have agent input yet, suspend for human review
    if (!reviewInput.approvedProducts.length) {
      console.log(`Generating recommendations for customer: ${customerName}`);
      await suspend({
        customerName,
        recommendations,
        message: 'Please review these product recommendations before sending to the customer',
      });

      // Placeholder return (won't be reached due to suspend)
      return {
        finalRecommendations: [],
        customerNote: '',
        offerDiscount: false,
      };
    }

    // Process the agent's product selections
    const finalRecommendations = recommendations
      .filter(product => reviewInput.approvedProducts.includes(product.productId))
      .map(product => ({
        productId: product.productId,
        productName: product.productName,
        price: product.price,
      }));

    return {
      finalRecommendations,
      customerNote: reviewInput.customerNote || '',
      offerDiscount: reviewInput.offerDiscount || false,
    };
  },
});

// Step 3: Send the recommendations to the customer
const sendRecommendations = new Step({
  id: 'sendRecommendations',
  outputSchema: z.object({
    emailSent: z.boolean(),
    emailContent: z.string(),
  }),
  execute: async ({ context }) => {
    const { customerName } = context.getStepResult(generateRecommendations) || { customerName: '' };
    const { finalRecommendations, customerNote, offerDiscount } = context.getStepResult(reviewRecommendations) || {
      finalRecommendations: [],
      customerNote: '',
      offerDiscount: false,
    };

    // Generate email content based on the recommendations
    let emailContent = `Dear ${customerName},\n\nBased on your preferences, we recommend:\n\n`;

    finalRecommendations.forEach(product => {
      emailContent += `- ${product.productName}: $${product.price.toFixed(2)}\n`;
    });

    if (offerDiscount) {
      emailContent += '\nAs a valued customer, use code SAVE10 for 10% off your next purchase!\n';
    }

    if (customerNote) {
      emailContent += `\nPersonal note: ${customerNote}\n`;
    }

    emailContent += '\nThank you for your business,\nThe Sales Team';

    // In a real application, you would send this email
    console.log('Email content generated:', emailContent);

    return {
      emailSent: true,
      emailContent,
    };
  },
});

// Build the workflow
export const recommendationWorkflow = new Workflow({
  name: 'productRecommendationWorkflow',
  triggerSchema,
});

recommendationWorkflow
  .step(generateRecommendations)
  .then(reviewRecommendations)
  .then(sendRecommendations)
  .commit();

import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { simulateContentAnalysis} from './mocks';

const triggerSchema = z.object({
  content: z.string(),
});

const analysisResultSchema =z.object({
  content: z.string(),
  aiAnalysisScore: z.number(),
  flaggedCategories: z.array(z.string()).optional(),
});

// request moderator review of AI Analysis
const moderatorReviewSchema = analysisResultSchema.extend({
  message: z.string().optional(),
});

const moderatorDecisionSchema = z.object({
  moderatorDecision: z.enum(['approve', 'reject', 'modify']).optional(),
  moderatorNotes: z.string().optional(),
  modifiedContent: z.string().optional(),
});

export type TriggerType = z.infer<typeof triggerSchema>;
export type ModeratorReviewType = z.infer<typeof moderatorReviewSchema>;
export type ModeratorDecisionType = z.infer<typeof moderatorDecisionSchema>;

// Step 1: Receive and analyze content
const analyzeContent = new Step({
  id: 'analyzeContent',
  outputSchema: analysisResultSchema,
  execute: async ({ context }) => {
    const content = context.triggerData.content;

    // Simulate AI analysis
    const aiAnalysisScore = simulateContentAnalysis(content);
    const flaggedCategories = aiAnalysisScore < 0.7
      ? ['potentially inappropriate', 'needs review']
      : [];

    return {
      content,
      aiAnalysisScore,
      flaggedCategories,
    };
  },
});

// Step 2: Moderate content that needs review
const moderateContent = new Step({
  id: 'moderateContent',
  // Define the schema for human input that will be provided when resuming
  inputSchema: moderatorDecisionSchema,
  outputSchema: z.object({
    moderationResult: z.enum(['approved', 'rejected', 'modified']),
    moderatedContent: z.string(),
    notes: z.string().optional(),
  }),
  // @ts-ignore
  execute: async ({ context, suspend }) => {
    const analysisResult = context.getStepResult(analyzeContent);
    // Access the input provided when resuming the workflow
    const moderatorInput = {
      decision: context.inputData?.moderatorDecision,
      notes: context.inputData?.moderatorNotes,
      modifiedContent: context.inputData?.modifiedContent,
    };

    // If the AI analysis score is high enough, auto-approve
    if (analysisResult?.aiAnalysisScore > 0.9 && !analysisResult?.flaggedCategories?.length) {
      return {
        moderationResult: 'approved',
        moderatedContent: analysisResult.content,
        notes: 'Auto-approved by system',
      };
    }

    // If we don't have moderator input yet, suspend for human review
    if (!moderatorInput.decision) {
      const suspendPayload: ModeratorReviewType = {
        content: analysisResult?.content,
        aiAnalysisScore: analysisResult?.aiAnalysisScore,
        flaggedCategories: analysisResult?.flaggedCategories,
        message: 'Please review this content and make a moderation decision',
      };
      await suspend(suspendPayload);

      // Placeholder return
      return {
        moderationResult: 'approved',
        moderatedContent: '',
      };
    }

    // Process the moderator's decision
    switch (moderatorInput.decision) {
      case 'approve':
        return {
          moderationResult: 'approved',
          moderatedContent: analysisResult?.content || '',
          notes: moderatorInput.notes || 'Approved by moderator',
        };

      case 'reject':
        return {
          moderationResult: 'rejected',
          moderatedContent: '',
          notes: moderatorInput.notes || 'Rejected by moderator',
        };

      case 'modify':
        return {
          moderationResult: 'modified',
          moderatedContent: moderatorInput.modifiedContent || analysisResult?.content || '',
          notes: moderatorInput.notes || 'Modified by moderator',
        };

      default:
        return {
          moderationResult: 'rejected',
          moderatedContent: '',
          notes: 'Invalid moderator decision',
        };
    }
  },
});

// Step 3: Apply moderation actions
const applyModeration = new Step({
  id: 'applyModeration',
  outputSchema: z.object({
    finalStatus: z.string(),
    content: z.string().optional(),
    auditLog: z.object({
      originalContent: z.string(),
      moderationResult: z.string(),
      aiScore: z.number(),
      timestamp: z.string(),
    }),
  }),
  execute: async ({ context }) => {
    const analysisResult = context.getStepResult(analyzeContent);
    const moderationResult = context.getStepResult(moderateContent);

    // Create audit log
    const auditLog = {
      originalContent: analysisResult?.content || '',
      moderationResult: moderationResult?.moderationResult || 'unknown',
      aiScore: analysisResult?.aiAnalysisScore || 0,
      timestamp: new Date().toISOString(),
    };

    // Apply moderation action
    switch (moderationResult?.moderationResult) {
      case 'approved':
        return {
          finalStatus: 'Content published',
          content: moderationResult.moderatedContent,
          auditLog,
        };

      case 'modified':
        return {
          finalStatus: 'Content modified and published',
          content: moderationResult.moderatedContent,
          auditLog,
        };

      case 'rejected':
        return {
          finalStatus: 'Content rejected',
          auditLog,
        };

      default:
        return {
          finalStatus: 'Error in moderation process',
          auditLog,
        };
    }
  },
});

// Build the workflow
export const contentModerationWorkflow = new Workflow({
  name: 'contentModerationWorkflow',
  triggerSchema,
});

contentModerationWorkflow
  .step(analyzeContent)
  .then(moderateContent)
  .then(applyModeration)
  .commit();

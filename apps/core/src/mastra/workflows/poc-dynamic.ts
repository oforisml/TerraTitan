import path from 'node:path';
import { checkbox } from '@inquirer/prompts';
import { Mastra } from '@mastra/core';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { sourceConverter } from '../agents/source-converter/index.js';
import { unitConverter } from '../agents/unit-converter/index.js';
import { workspaceInputSchema, workspaceOutputSchema, ensureWorkspace } from './steps/ensure-workspace.js';
import {
  ragResultSchema,
  retrieveCdktfRefSchema,
  ragRerankResultSchema,
  retrieveCdktfReferences,
} from './steps/retrieve-cdktf-ref.js';
import { ragReviewDecisionSchema, reviewCdktfReferences, RAGReviewType } from './steps/review-cdktf-ref.js';
import { ensureUpstreamOutputSchema } from './steps/ensure-upstream.js';
import { isMastra, writeCodeFromStep, conversionOutputSchema } from './util.js';
import { findSrcInputRefs } from './steps/find-input-refs.js';

/**
 * A single Conversion request
 */
export const conversionSchema = z.object({
  inputFile: z.string(),
  // inputRefFiles: z.array(z.string()),
  inputRefs: z.array(
    z.object({
      sourceFile: z.string(),
      sourceClass: z.string(),
    }),
  ),
  // outputRefFiles: z.array(z.string()),
  // outputRefs: z.array(
  //   z.object({
  //     sourceFile: z.string(),
  //     sourceClass: z.string(),
  //   }),
  // ),
  // outputPath: z.string(),
});

/**
 * Dynamic Workflow trigger schema
 */
const triggerSchema = z.object({
  /**
   * The Upstream Module information to use for the conversion
   */
  upstreamModule: ensureUpstreamOutputSchema,
  /**
   * The run the conversion into
   */
  workspace: workspaceInputSchema,
  /**
   * The output module to write to within the Workspace
   */
  outputModule: z.string(),
  // sourceCodeConversions: z.array(conversionSchema),
  // unitTestConversions: z.array(conversionSchema),
});

export type TriggerType = z.infer<typeof triggerSchema>;
export type RerankedResultType = z.infer<typeof ragRerankResultSchema>;
export type RAGResultType = z.infer<typeof ragResultSchema>;
export type RAGReviewDecisionType = z.infer<typeof ragReviewDecisionSchema>;

/**
 * A workflow to run dynamic conversions into a workspace
 */
export const parentWorkflow = new Workflow({
  name: 'parent-workflow',
  triggerSchema,
  mastra: new Mastra(),
});

/**
 * A step creating dynamic workflows for workspaced source code and unit test conversions
 *
 * @see https://mastra.ai/docs/workflows/dynamic-workflows
 */
const createDynamicWorkflow = new Step({
  id: 'createWorkspaceConversionsWorkflow',
  outputSchema: z.object({
    results: z.any(),
  }),
  execute: async ({ context, mastra }) => {
    if (!mastra) {
      throw new Error('Mastra instance not available');
    }

    if (!isMastra(mastra)) {
      throw new Error('Invalid Mastra instance');
    }

    const upstreamDetails = ensureUpstreamOutputSchema.parse(context.triggerData.upstreamModule);
    const outputModule = context.triggerData.outputModule;
    const { inputFiles: sourceCodeConversions } = await findSrcInputRefs(upstreamDetails);
    // const { inputFiles: unitTestConversions } = await findTestInputRefs(upstreamDetails);

    const dynamicTriggerSchema = z.object({
      upstreamModule: ensureUpstreamOutputSchema,
      workspace: workspaceInputSchema,
      sourceCodeConversions: z.array(conversionSchema),
      // unitTestConversions: z.array(conversionSchema),
    });

    // Create a new dynamic workflow
    const dynamicWorkflow = new Workflow({
      name: 'workspace-conversions-workflow',
      mastra, // Pass the mastra instance to the new workflow
      triggerSchema: dynamicTriggerSchema,
    });

    const ensureWorkspaceStep = new Step({
      id: 'ensureWorkspace',
      inputSchema: workspaceInputSchema,
      outputSchema: workspaceOutputSchema,
      execute: async ({ context }) => {
        // https://mastra.ai/docs/workflows/control-flow#using-variable-mapping
        const { repositoryUrl, id } = context.inputData;
        return await ensureWorkspace({
          repositoryUrl,
          id,
        });
      },
    });

    dynamicWorkflow
      .step(ensureWorkspaceStep, {
        variables: {
          // INFO: variable.path is passed to https://radash-docs.vercel.app/docs/object/get
          id: { step: 'trigger', path: 'workspace.id' },
          repositoryUrl: { step: 'trigger', path: 'workspace.repositoryUrl' },
        },
      })
      .after(ensureWorkspaceStep);

    // Create parallel RAG each sourceCode file
    const ragReviewSteps: Step<any, any, any>[] = [];
    sourceCodeConversions.slice(1, 3).forEach((input, index) => {
      // TODO: Use Nested Workflow instead?`
      const id = `retrieveCdktfRefs-${index}`;
      const retrieveCdktfRefs = new Step({
        id,
        outputSchema: z.object({
          inputFile: z.string(),
          ragResults: z.array(ragResultSchema),
        }),
        execute: async () => {
          const fileName = path.basename(input.inputFile);
          console.log(`${id}: ${input.inputFile} > ${path.join('src', 'aws', outputModule, fileName)}`);
          const result: z.infer<typeof ragResultSchema>[] = [];
          for (const inputRef of input.inputRefs) {
            result.push(
              await retrieveCdktfReferences({
                sourceFile: inputRef.sourceFile,
                sourceClass: inputRef.sourceClass,
              }),
            );
            console.log(`  ${inputRef.sourceFile} / ${inputRef.sourceClass}`);
          }
          return {
            inputFile: input.inputFile,
            ragResults: result,
          };
        },
      });

      // Review the CDKTF references retrieved
      const reviewCdktfRefs = new Step({
        id: `reviewCdktfReferences-${index}`,
        // Schema for human input that will be provided when resuming workflow
        inputSchema: ragReviewDecisionSchema,
        outputSchema: ragResultSchema,
        execute: async ({ context, suspend }) => {
          const cdktfRefs = context.getStepResult(retrieveCdktfRefs);
          // TODO: Handle ALL sourceClass ragResults.. not just the first
          // FAKE IT - with first only
          const ragResult = cdktfRefs.ragResults[0]!;
          return await reviewCdktfReferences(
            ragResult,
            suspend,
            // Pass the human input to the review function
            context.inputData,
          );
        },
      });
      ragReviewSteps.push(reviewCdktfRefs);
      // TODO: Join all Retrieval Steps into a single Human review step
      dynamicWorkflow.step(retrieveCdktfRefs).then(reviewCdktfRefs);
    });

    // sourceCodeConversions: [
    //   {
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
    //     outputPath: path.join('src', 'aws', 'notify', 'topic.ts'),
    //   },
    // ],
    // unitTestConversions: [
    //   {
    //     // TODO: Use correct path to the aws-cdk-lib source files (currently this is under samples)
    //     inputFile: path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'test', 'sns.test.ts'),
    //     inputRefFiles: [
    //       // TODO: Use correct path to the aws-cdk-lib Pkg files (currently this is under samples)
    //       path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'declarations', 'topic.d.ts'),
    //       path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'declarations', 'topic-base.d.ts'),
    //       path.join(awsCdkSrcDir, 'aws-sns', 'topic', 'input', 'declarations', 'policy.d.ts'),
    //     ],
    //     outputRefFiles: [
    //       path.join(markdownAwsDocs, 'sns_topic.html.markdown'),
    //       path.join(markdownAwsDocs, 'sns_topic_policy.html.markdown'),
    //       path.join(markdownAwsDocs, 'sns_topic_data_protection_policy.html.markdown'),
    //     ],
    //     outputPath: path.join('test', 'aws', 'notify', 'sns.test.ts'),
    //   },
    // ],

    // // Create parallel steps for each source code conversion
    // sourceCodeConversions.forEach((conversion, index) => {
    //   // TODO: Use Nested Workflow instead?`
    //   const id = `convertSourceCode-${index}`;
    //   const convertSourceCode = new Step({
    //     id,
    //     outputSchema: conversionOutputSchema,
    //     execute: async () => {
    //       console.log(`${id}: ${conversion.inputFile} > ${conversion.outputPath}`);
    //       const result = await sourceConverter.convert(conversion);
    //       return {
    //         ...result,
    //         outputPath: conversion.outputPath,
    //       };
    //     },
    //   });
    //   dynamicWorkflow.step(convertSourceCode).then(
    //     new Step({
    //       id: `writeSourceCodeToWorkspace-${index}`,
    //       execute: writeCodeFromStep(convertSourceCode.id),
    //     }),
    //   );
    // });

    // // Create parallel steps for each unit test conversion
    // unitTestConversions.forEach((conversion, index) => {
    //   // TODO: Use Nested Workflow instead
    //   const id = `convertUnitTest-${index}`;
    //   const convertUnitTest = new Step({
    //     id,
    //     outputSchema: conversionOutputSchema,
    //     execute: async () => {
    //       console.log(`${id}: ${conversion.inputFile} > ${conversion.outputPath}`);
    //       const result = await unitConverter.convert(conversion);
    //       return {
    //         ...result,
    //         outputPath: conversion.outputPath,
    //       };
    //     },
    //   });
    //   dynamicWorkflow.step(convertUnitTest).then(
    //     new Step({
    //       id: `writeUnitTestToWorkspace-${index}`,
    //       execute: writeCodeFromStep(convertUnitTest.id),
    //     }),
    //   );
    // });
    // TODO: Evaluate the generated workspace against criteria
    dynamicWorkflow.commit();

    // Create a run and execute the dynamic workflow
    const run = dynamicWorkflow.createRun();
    // Start the workflow with content that needs review
    const dynamicRunResult = await run.start({
      triggerData: {
        upstreamModule: upstreamDetails,
        workspace: context.triggerData.workspace,
        sourceCodeConversions,
        // unitTestConversions: context.triggerData.unitTestConversions,
      },
    });

    console.log(`Active Paths: ${JSON.stringify(dynamicRunResult.activePaths)}`);

    // TODO: This does not work as expected, we need to handle resume in the entrypoint calling parentWorkflow...
    // const reviewResumeResults: any[] = [];
    for (const step of ragReviewSteps) {
      const reviewStep = dynamicRunResult.activePaths.get(step.id);
      console.log(`Step ${step.id} status: ${reviewStep?.status}`);

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
          stepId: step.id,
          context: resumeInput,
        });

        if (resumeResult && resumeResult.results && resumeResult.results[step.id]) {
          const stepResult = resumeResult.results[step.id]!;

          console.log('\n===================================');
          console.log('CDKTF Reference Selection complete');
          console.log('===================================\n');

          if (stepResult.status === 'success' && stepResult.output.rerankedResults) {
            console.log('Final References:');
            console.log(stepResult.output.rerankedResults);
          }
        }

        // reviewResumeResults.push(resumeResult);
      }
    }

    // if (
    //   dynamicRunResult.results?.reviewCdktfReferences?.status &&
    //   dynamicRunResult.results.reviewCdktfReferences.status === 'success'
    // ) {
    //   console.log(
    //     'Workflow completed without requiring human intervention:',
    //     dynamicRunResult.results?.reviewCdktfReferences?.output.rerankedResults,
    //   );
    // } else {
    //   console.log('Workflow completed without requiring human intervention:', dynamicRunResult.results);
    // }
    // TODO: Detect dynamic workflow failure...
    // Return the results from the dynamic workflow
    return {
      results: dynamicRunResult.results,
    };
  },
});

parentWorkflow.step(createDynamicWorkflow).commit();

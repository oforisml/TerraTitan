// import * as path from 'path';
import { Step, Workflow } from '@mastra/core/workflows';
// import { z } from 'zod';
import { ensureUpstreamInputSchema, ensureUpstreamOutputSchema, ensureUpstream } from './steps/ensure-upstream.js';
import { findInputRefs, findInputRefsOutputSchema } from './steps/find-input-refs.js';

// Build the workflow
export const upstreamWorkflow = new Workflow({
  name: 'upstreamWorkflow',
  triggerSchema: ensureUpstreamInputSchema,
});

const ensureUpstreamStep = new Step({
  id: 'ensureUpstream',
  inputSchema: ensureUpstreamInputSchema,
  outputSchema: ensureUpstreamOutputSchema,
  execute: async ({ context }) => {
    return await ensureUpstream(context.inputData);
  },
});

/**
 * A step to walk the upstream directory and find all the lib input references
 */
const findInputRefsStep = new Step({
  id: 'findInputRefs',
  inputSchema: ensureUpstreamOutputSchema,
  outputSchema: findInputRefsOutputSchema,
  execute: async ({ context }) => {
    const upstreamDetails = ensureUpstreamOutputSchema.parse(context.getStepResult('ensureUpstream'));
    return await findInputRefs(upstreamDetails);
  },
});

upstreamWorkflow
  .step(ensureUpstreamStep, {
    variables: {
      // INFO: variable.path is passed to https://radash-docs.vercel.app/docs/object/get
      moduleName: { step: 'trigger', path: 'moduleName' },
    },
  })
  .then(findInputRefsStep)
  .commit();

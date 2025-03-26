import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

const llm = openai('gpt-4o');

// TODO: add agentic instructions here
// const agent = new Agent({})

const fetchPackage = new Step({
  id: 'fetch-package',
  description: 'Fetches the target AWSCDKTF package',
  inputSchema: z.object({
    target: z.string().describe('The target AWSCDKTF package to convert'),
  }),
  execute: async ({ context }) => {
    // TODO: implement
  },
});
const mergeDocs = new Step({
  id: 'merge-docs',
  inputSchema: z.object({
    target: z.string().describe('The target AWSCDKTF package to convert'),
  }),
  execute: async ({ context }) => {
    // TODO: implement
  },
});

const convert = new Step({
  id: 'convert',
  inputSchema: z.object({
    target: z.string().describe('The target AWSCDKTF package to convert'),
  }),
  execute: async ({ context }) => {
    // TODO: implement
  },
});

const validate = new Step({
  id: 'validate',
  inputSchema: z.object({
    target: z.string().describe('The target AWSCDKTF package to convert'),
  }),
  execute: async ({ context }) => {
    // TODO: implement
  },
});

const publish = new Step({
  id: 'publish',
  inputSchema: z.object({
    target: z.string().describe('The target AWSCDKTF package to convert'),
  }),
  execute: async ({ context }) => {
    // TODO: implement
  },
});

const convertWorkflow = new Workflow({
  name: 'convert-workflow',
  triggerSchema: z.object({
    target: z.string().describe('The target AWSCDKTF package to convert'),
  }),
}).step(fetchPackage)
  .then(mergeDocs)
  .then(convert)
  .then(validate)
  .then(publish);

convertWorkflow.commit();

export { convertWorkflow };
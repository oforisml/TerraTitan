import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Step, Workflow } from '@mastra/core/workflows';
import { z } from 'zod';

const llm = openai('gpt-4o');

const agent = new Agent({
  name: 'convert-agent',
  model: llm,
  instructions: ``, // TODO: add system instructions here
  evals: {
    // TODO: add evals here
  },
})

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
  execute: async ({ context, mastra }) => {
    const packageContent = context?.getStepResult('fetch-package'); // might be from another step

    if (!packageContent) {
      throw new Error('Package content not found');
    }

    const prompt = `Convert the following AWSCDKTF package to CDKTF:
    ${context?.getStepResult('fetch-package')}
    `;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let convertedText = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      convertedText += chunk;
    }

    return {
      converted: convertedText,
    };
    // TODO: add evals here?
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
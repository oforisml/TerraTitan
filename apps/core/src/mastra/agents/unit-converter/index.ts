import { google } from '@ai-sdk/google';
import { type CoreMessage } from '@mastra/core';
import { z } from 'zod';
import { ConverterAgent } from '../converter/index.js';
import { Sample, type ConversionRequestProps } from '../../util/index.js';
import { generateInstructions, generateSampleInput, generateSampleResponse, generateNewPrompt } from './prompts.js';

const GEMINI_2_5_PRO = 'gemini-2.5-pro-exp-03-25';

/**
 * Class to convert unit test code from AWS CDK to TerraConstructs
 *
 * Hardcoded for:
 * - Google Provider
 * - 2 Shot AWSCDK -> TerraConstructs Samples
 */
class UnitConverterAgent extends ConverterAgent {
  private readonly _samples: Sample[];
  constructor(sampleNameOne: string, sampleNameTwo: string, model: string = GEMINI_2_5_PRO) {
    super(
      'Source Code',
      generateInstructions(),
      // ref: https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai#provider-instance
      google(model),
    );
    this._samples = [Sample.fromName(sampleNameOne), Sample.fromName(sampleNameTwo)];
  }
  /**
   * Converts the source code from AWS CDK to TerraConstructs
   *
   * With a few-shot learning approach, the agent is trained on a few examples of input and output code.
   * The agent then uses the provided input code and reference documents to generate the output code.
   *
   * @param requestProps The conversion request properties
   * @returns The converted source code
   */
  async convert(requestProps: ConversionRequestProps): Promise<{ code: string }> {
    const messages: CoreMessage[] = [];
    for (const sample of this._samples) {
      messages.push({
        role: 'user',
        content: generateSampleInput(sample),
      });
      messages.push({
        role: 'assistant',
        content: generateSampleResponse(sample),
      });
    }
    messages.push({
      role: 'user',
      content: generateNewPrompt(requestProps),
    });
    const result = await this.agent.generate(messages, {
      output: z.object({
        code: z.string(),
      }),
      temperature: 0,
    });

    return result.object;
  }
}

// export an instance of the UnitConverterAgent with few shot samples
export const unitConverter = new UnitConverterAgent('aws-events/event-bus/test', 'aws-kinesis/stream/test');

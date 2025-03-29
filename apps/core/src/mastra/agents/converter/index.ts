import { Agent } from '@mastra/core/agent';
import type { LanguageModel } from '@mastra/core';
import type { ConversionRequestProps } from '../../util/index.js';

/**
 * Abstract class for Converter Agents
 */
export abstract class ConverterAgent {
  protected readonly agent: Agent;

  constructor(name: string, instructions: string, model: LanguageModel) {
    this.agent = new Agent({
      name: `Converter Agent for ${name}`,
      instructions: instructions,
      model,
    });
  }

  abstract convert(request: ConversionRequestProps): Promise<{ code: string }>;
}

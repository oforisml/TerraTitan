import { encoding_for_model, type TiktokenModel } from 'tiktoken';

/**
 * Calculate the length of Tokens for an OpenAI Model
 *
 * using the TikToken library
 *
 * Ref: https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken
 */
export class TokenCounter {
  private enc: ReturnType<typeof encoding_for_model>;

  constructor(model: TiktokenModel) {
    this.enc = encoding_for_model(model);
  }

  count(...prompts: string[]): number[] {
    const lengths = prompts.map(p => this.enc.encode(p).length);
    return lengths;
  }

  free() {
    this.enc.free();
  }
}

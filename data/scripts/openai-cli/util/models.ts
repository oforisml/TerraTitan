// import ChatModel from "openai";

// TODO: Probably create a proper class instead of interfaces

// TODO: Test March'25 models - Chat completions only:
// gpt-4o-search-preview, gpt-4o-mini-search-preview, computer-use-preview

/**
 * Simple check to see if a model is a reasoning model
 */
export function isReasoningModel(model: OPENAI_MODEL | GEMINI_MODEL): boolean {
  return !model.startsWith("gpt");
}

export enum GEMINI_MODEL {
  GEMINI_2_5_PRO_EXP_03_25 = "gemini-2.5-pro-exp-03-25",
}

/**
 * Models supported in the Response API
 *
 * Ref: https://platform.openai.com/playground/prompts?models=o3-mini-2025-01-31
 */
export enum OPENAI_MODEL {
  /**
   * Fast, affordable small model for focused tasks
   *
   * Very Cheap and fast model, no reasoning
   */
  GPT_4O_MINI = "gpt-4o-mini",
  /**
   * Fast, flexible, intelligent reasoning model
   *
   * Reasoning, Same price as o1-mini, much larger context window
   */
  O3_MINI = "o3-mini",
  /**
   * o3-mini model with a snapshot pin
   *
   * This is a snapshot pin if you want to ensure using the same model in the future
   */
  O3_MINI_20250131 = "o3-mini-2025-01-31",
  /**
   * A faster, more affordable reasoning model than o1
   *
   * Reasoning, Same price as o3-mini,
   * much smaller Context window (same as gpt-4o-mini)
   */
  O1_MINI = "o1-mini",
  /**
   * High-intelligence reasoning model
   *
   * Reasoning Larger model, but way more expensive and slower compared to GPT-4o or o3 models
   */
  O1 = "o1",
  /**
   * o1 model with a snapshot pin
   *
   * This is a snapshot pin if you want to ensure using the same model in the future
   */
  O1_20241217 = "o1-2024-12-17",
  // O1_PREVIEW = "o1-preview", // Not supported in Response API
}

/**
 * Models available for Batch API (much cheaper for many conversions, 24hr response time)
 *
 * https://platform.openai.com/docs/guides/batch#3-create-the-batch
 */
export enum OPENAI_BATCH_MODEL {
  O1 = "o1",
  O3_MINI = "o3-mini",
}

/**
 * Get the maximum number of tokens allowed for a given model
 *
 * To manage costs with reasoning models, you can limit the total number of tokens the model generates (including both reasoning and final output tokens)
 * An upper bound for the number of tokens that can be generated for a response, including visible output tokens and reasoning tokens.
 *
 * Ref: https://platform.openai.com/docs/guides/reasoning?api-mode=responses#managing-the-context-window
 */
export function maxOutputTokens(model: OPENAI_MODEL): number {
  switch (model) {
    case OPENAI_MODEL.O3_MINI:
    case OPENAI_MODEL.O3_MINI_20250131:
    case OPENAI_MODEL.O1:
    case OPENAI_MODEL.O1_20241217:
      return 100_000;
    case OPENAI_MODEL.O1_MINI:
      return 65_536;
    case OPENAI_MODEL.GPT_4O_MINI:
      return 16_384;
  }
}

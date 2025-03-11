import Anthropic from "@anthropic-ai/sdk";
import { config } from "dotenv";

// Load environment variables
config();

let anthropicClient: Anthropic | null = null;

/**
 * Set up the Anthropic client with API key
 */
export function setupAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  anthropicClient = new Anthropic({
    apiKey,
  });

  return anthropicClient;
}

/**
 * Get the Anthropic client instance
 */
export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    return setupAnthropicClient();
  }
  return anthropicClient;
}

/**
 * Generate text using Claude
 */
export async function generateWithClaude(
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    system?: string;
  } = {}
) {
  const client = getAnthropicClient();

  const response = await client.messages.create({
    model: "claude-3-opus-20240229",
    max_tokens: options.maxTokens || 4000,
    temperature: options.temperature || 0.2,
    system:
      options.system ||
      "You are a helpful AI assistant specialized in converting AWS CDK constructs to Terraform CDK.",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return response.content[0].text;
}

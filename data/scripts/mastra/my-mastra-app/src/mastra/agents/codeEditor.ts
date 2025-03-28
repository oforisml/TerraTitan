import { openai } from "@ai-sdk/openai";
import { fileFromPath } from "@anthropic-ai/sdk";
import { Agent } from "@mastra/core/agent";

const model = openai("gpt-4o-mini");

export const codeEditorAgent = new Agent({
  name: "Code Editor Agent",
  instructions: String(fileFromPath(
    "../../../../../openai-cli/prompts/source/instructions-v1.md"
  )),
  model: model,
  tools: {
    // Add tools here
  },
});
import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

export const codeEditorAgent = new Agent({
  name: "Code Editor Agent",
  instructions: `You are a helpful code editor that assists users in writing and debugging code.`,
  model: openai("gpt-4o-mini"),
  tools: {
    // Add tools here
  },
});
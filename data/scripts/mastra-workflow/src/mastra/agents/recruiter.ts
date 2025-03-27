import { openai } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";

export const recruiter = new Agent({
  name: "Recruiter Agent",
  instructions: `You are a recruiter.`,
  model: openai("gpt-4o-mini"),
});

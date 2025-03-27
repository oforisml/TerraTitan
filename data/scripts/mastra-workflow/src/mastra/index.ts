import { Mastra } from "@mastra/core";

// import { weatherAgent } from "./agents/weather";
import { candidateWorkflow } from "./workflows/candidate";
import { myWorkflow } from "./workflows/demo";

export const mastra = new Mastra({
  // agents: { weatherAgent },
  workflows: {
    candidateWorkflow,
    myWorkflow,
  },
});

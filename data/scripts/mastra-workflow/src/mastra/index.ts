import { Mastra } from "@mastra/core";

// import { weatherAgent } from "./agents/weather";
import { candidateWorkflow } from "./workflows/candidate";
import { myWorkflow } from "./workflows/demo";
import { convertWorkflow } from "./workflows/convert";

export const mastra = new Mastra({
  // agents: { weatherAgent },
  workflows: {
    candidateWorkflow,
    myWorkflow,
    convertWorkflow,
  },
});

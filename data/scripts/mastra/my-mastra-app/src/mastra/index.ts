import { Mastra } from "@mastra/core";
import { DefaultStorage } from "@mastra/core/storage/libsql";

// import { weatherAgent } from "./agents/weather";
import { candidateWorkflow } from "./workflows/candidate";
import { myWorkflow } from "./workflows/demo";
// import { convertWorkflow } from "./workflows/convert";
import { weatherWorkflow } from "./workflows/weather";
import { basicSuspendWorkflow } from './workflows/basic-suspend';
import { recommendationWorkflow } from './workflows/human-in-the-loop';
import { contentModerationWorkflow } from './workflows/mod-demo';

export const mastra = new Mastra({
  // ensure storage config for suspend/resume workflows
  storage: new DefaultStorage({
    config: {
      url: "file:.mastra/mastra.db",
    },
  }),
  // agents: { weatherAgent },
  workflows: {
    candidateWorkflow,
    myWorkflow,
    weatherWorkflow,
    // convertWorkflow,
    basicSuspendWorkflow,
    recommendationWorkflow,
    contentModerationWorkflow,
  },
});

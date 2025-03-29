import { Mastra } from '@mastra/core';

import { sourceConversionWorkflow } from './workflows/source-convert.js';
// TODO: sourceConverter does net extend Agent and is custom for single workflow
// import { sourceConverter } from "./agents/source-converter";

export const mastra: Mastra = new Mastra({
  agents: {},
  workflows: { sourceConversionWorkflow },
});

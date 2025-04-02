import { Mastra } from '@mastra/core';

import { sourceConversionWorkflow } from './workflows/source-convert.js';
import { unitConversionWorkflow } from './workflows/unit-convert.js';
import { parentWorkflow } from './workflows/parent.js';
// import { sourceConverter } from './agents/source-converter/index.js';

export const mastra: Mastra = new Mastra({
  // TODO: sourceConverter should extend Agent?
  // agents: { sourceConverter },
  workflows: { sourceConversionWorkflow, unitConversionWorkflow, parentWorkflow },
});

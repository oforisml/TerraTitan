import { Mastra } from '@mastra/core';
import { DefaultStorage } from '@mastra/core/storage/libsql';

import { sourceConversionWorkflow } from './workflows/source-convert.js';
import { unitConversionWorkflow } from './workflows/unit-convert.js';
import { parentWorkflow } from './workflows/parent.js';
import { cdktfRefWorkflow } from './workflows/ref-wf.js';
// import { sourceConverter } from './agents/source-converter/index.js';

export const mastra: Mastra = new Mastra({
  // TODO: sourceConverter should extend Agent?
  // agents: { sourceConverter },
  // ensure storage config for suspend/resume workflows
  storage: new DefaultStorage({
    config: {
      url: 'file:.mastra/mastra.db',
    },
  }),
  workflows: { sourceConversionWorkflow, unitConversionWorkflow, parentWorkflow, cdktfRefWorkflow },
});

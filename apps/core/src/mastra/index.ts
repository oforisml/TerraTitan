import { Mastra } from '@mastra/core';
import { DefaultStorage } from '@mastra/core/storage/libsql';

// import workflows
import { conversionWorkflow } from './workflows/conversion.js';
import { sourceConversionWorkflow } from './workflows/poc-source-convert.js';
import { unitConversionWorkflow } from './workflows/poc-unit-convert.js';
import { parentWorkflow } from './workflows/poc-dynamic.js';
import { cdktfRefWorkflow } from './workflows/poc-cdktf-ref.js';
import { upstreamWorkflow } from './workflows/poc-ensure-upstream.js';
import { vNextWorkflow } from './workflows/vnext.js';
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
  workflows: {
    conversionWorkflow,
    // PoC workflows
    sourceConversionWorkflow,
    unitConversionWorkflow,
    parentWorkflow,
    cdktfRefWorkflow,
    upstreamWorkflow,
  },
  vnext_workflows: {
    vNextWorkflow,
  },
});

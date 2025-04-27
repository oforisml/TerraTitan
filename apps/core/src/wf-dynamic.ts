import { mastra } from './mastra/index.js';
import { ensureUpstream } from './mastra/workflows/steps/ensure-upstream.js';
import { type TriggerType } from './mastra/workflows/poc-dynamic.js';
import { CommandLineArgs, getConversionInputs } from './cli-util.js';

/**
 * Conversion dynamic workflow
 * This workflow converts an AWS CDK Module into a TerraConstructs Workspace
 */
export async function runDynamicWf(args?: CommandLineArgs) {
  const { moduleName, workspaceId, outputModule } = await getConversionInputs(args);
  const stagedUpstreamModule = await ensureUpstream({ moduleName });

  const parentWorkflow = mastra.getWorkflow('parentWorkflow');
  const logger = mastra.getLogger();
  const triggerData: TriggerType = {
    upstreamModule: stagedUpstreamModule,
    workspace: {
      id: workspaceId,
      repositoryUrl: 'https://github.com/TerraConstructs/base.git',
    },
    outputModule,
  };

  logger.info(`Running ${moduleName} > ${outputModule} Conversion workflow...`);
  // Trigger the parent workflow with the trigger data
  const { runId, start } = parentWorkflow.createRun();
  logger.info(`Run ID: ${runId}`);
  const runResult = await start({ triggerData });
  logger.info(`Final output: ${JSON.stringify(runResult.results, null, 2)}`);
}

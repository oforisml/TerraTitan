import { search } from '@inquirer/prompts';
import { mastra } from './mastra/index.js';
import { CommandLineArgs, awsCdkModules } from './cli-util.js';

export async function runEnsureUpstreamWf(args?: CommandLineArgs) {
  const wf = mastra.getWorkflow('upstreamWorkflow');
  const logger = mastra.getLogger();
  const run = wf.createRun();
  const moduleName =
    args?.module ||
    (await search({
      message: 'Enter the AWSCDK module name (e.g., aws-sns):',
      source: async input => {
        if (!input) {
          return [];
        }
        const filteredModules = awsCdkModules.filter(name => name.startsWith(input));
        if (filteredModules.length > 0) {
          return filteredModules.map(name => ({
            name,
            value: name,
            description: `Found in local aws-cdk-lib: ${name}`,
          }));
        }
        return [];
      },
    }));
  const triggerData = { moduleName };
  logger.info('Running Ensure Upstream workflow...');
  logger.info(`Trigger data: ${JSON.stringify(triggerData, null, 2)}`);
  const result = await run.start({ triggerData });
  logger.info(`Final output: ${JSON.stringify(result.results, null, 2)}`);
  return result;
}

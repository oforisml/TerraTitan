import { mastra } from "./mastra";
import { TriggerType } from './mastra/workflows/basic-suspend';

async function main() {
  const triggerData: TriggerType = {
    inputValue: 49,
  }
  const workflow = mastra.getWorkflow("basicSuspendWorkflow");
  // Trigger the parent workflow with the trigger data
  // const { runId, start } = workflow.createRun();
  // console.log('Run ID:', runId);
  const { start, watch, resume } = workflow.createRun();
  // Start watching the workflow before executing it
  watch(async ({ activePaths }) => {
    const isStepTwoSuspended = activePaths.get("stepTwo")?.status === "suspended";
    if (isStepTwoSuspended) {
      console.log("Workflow suspended ...");

      // Resume the workflow with new context
      const resumeResult = await resume({
        stepId: "stepTwo",
        context: { secondValue: 100 },
      });
      if (!resumeResult) {
        console.error("Workflow was not resumed");
        return;
      }
      console.log('Resume runResult:', JSON.stringify(resumeResult.results, null, 2));

      // print summary of all workflow runs
      const allRuns = await workflow.getWorkflowRuns();
      const summary = allRuns.runs.map((run) => ({
        id: run.runId,
        status: typeof run.snapshot === 'string' ? run.snapshot : run.snapshot.value,
        createdAt: run.createdAt,
        updatedAt: run.updatedAt,
      }));
      console.log('All runs:', JSON.stringify(summary, null, 2));
    }
  });

  // Start the workflow execution
  const runResult = await start({ triggerData });
  console.log('Start runResult:', JSON.stringify(runResult.results, null, 2));
}
main();

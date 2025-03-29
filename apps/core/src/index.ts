import { mastra } from "./mastra";

async function main() {
  // const agent = mastra.getAgent("recruiter");
  // const result = await agent.generate(
  //   "What is the weather in Thanh Pho Ho Chi Minh?"
  // );
  // console.log("Agent response:", result.text);
  // const workflow = mastra.getWorkflow("candidateWorkflow");
  const workflow = mastra.getWorkflow("myWorkflow");
  const { runId, start } = workflow.createRun();
  console.log("Run ID:", runId);

  const runResult = await start({
    triggerData: {
      // resumeText: "I am a software engineer with 5 years of experience.",
      inputValue: 5,
    },
  });

  console.log("Final output:", runResult.results);
}

main();

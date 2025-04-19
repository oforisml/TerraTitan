import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";

const triggerSchema = z.object({
  inputValue: z.number(),
});

export type TriggerType = z.infer<typeof triggerSchema>;
const stepOne = new Step({
  id: "stepOne",
  outputSchema: z.object({
    doubledValue: z.number(),
  }),
  execute: async ({ context }) => {
    const inputData = context.getStepResult<TriggerType>("trigger");
    if (!inputData) {
      throw new Error("Input data not found");
    }
    const currentValue = inputData.inputValue;
    if (currentValue < 0) {
      throw new Error("Input value must be non-negative");
    }
    return { doubledValue: currentValue * 2 };
  },
});

const stepTwo = new Step({
  id: "stepTwo",
  outputSchema: z.object({
    incrementedValue: z.number(),
  }),
  execute: async ({ context, suspend }) => {
    if (context.steps.stepOne.status !== "success") {
      return { incrementedValue: 0 };
    }


    const secondValue = context.inputData?.secondValue ?? 0;
    const doubledValue = context.getStepResult(stepOne)?.doubledValue ?? 0;

    const incrementedValue = doubledValue + secondValue;

    if (incrementedValue < 100) {
      await suspend();
      return { incrementedValue: 0 };
    }
    return { incrementedValue };
  },
});

export const basicSuspendWorkflow = new Workflow({
  name: "basic-suspend-workflow",
  triggerSchema,
});
basicSuspendWorkflow
  .step(stepOne)
  .then(stepTwo);
basicSuspendWorkflow.commit();

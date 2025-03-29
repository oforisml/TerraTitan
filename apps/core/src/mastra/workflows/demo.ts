import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";

export const myWorkflow = new Workflow({
  name: "my-workflow",
  triggerSchema: z.object({
    inputValue: z.number(),
  }),
});

const stepOne = new Step({
  id: "StepOne",
  outputSchema: z.object({
    doubledValue: z.number(),
  }),
  execute: async ({ context }) => {
    const inputValue = context.triggerData.inputValue as number;
    return { doubledValue: inputValue * 2 };
  },
});

const stepTwo = new Step({
  id: "StepTwo",
  outputSchema: z.object({
    incrementedValue: z.number(),
  }),
  execute: async ({ context }) => {
    const doubledValue = context.getStepResult("StepOne")?.doubledValue;
    if (!doubledValue) {
      return { incrementedValue: 0 };
    }
    return { incrementedValue: doubledValue + 1 };
  },
});

myWorkflow.step(stepOne).step(stepTwo).commit();

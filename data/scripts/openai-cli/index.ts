/**
 * Sample implementation of Conversion CLI using OpenAI Responses API
 *
 * Ref: https://cookbook.openai.com/examples/responses_api/responses_example
 */
import path from "path";
import fs from "fs";
import OpenAI from "openai/index.mjs";
import ora from "ora";
import dotenv from "dotenv";
import type { ConversionRequest } from "./util/types";
import {
  calucateTokens,
  getDateSuffix,
  paddedHumanNumber,
  extractCode,
} from "./util/helpers";
import { OPENAI_MODEL, maxOutputTokens, isReasoningModel } from "./util/models";
import { Sample } from "./util/samples";
// path to data/ directory
const baseDir = `${__dirname}/../..`;

// const model = OPENAI_MODEL.GPT_4O_MINI;
const model = OPENAI_MODEL.O3_MINI;
process.stdout.write(`Selected Model: ${model}\n`);

/**
 * **o-series models only**
 *
 * Constrains effort on reasoning for
 * [reasoning models](https://platform.openai.com/docs/guides/reasoning).
 *
 * - `low` will favor speed and economical token usage
 * - `high` will favor more complete reasoning at the cost of more tokens generated and slower responses.
 *
 * The default value is `medium`, which is a balance between speed and reasoning accuracy.
 */
const reasoningEffort: OpenAI.ReasoningEffort = "medium";

const newInputRequest: ConversionRequest = {
  inputFile: `${baseDir}/samples/aws-events/connection/input/src/connection.ts`,
  // TODO: Filter down to just the relevant classes/interfaces?
  inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,
  outputRefFiles: [
    // Note: created by running bun scripts/merge-docs/index.ts!
    `${baseDir}/reference/merged/provider-aws/cloudwatch-event-connection/index.d.ts`,
  ],
  responseFile: `./responses/connection-response-${getDateSuffix()}.md`,
};

// For token estimates... TODO: automated Evals (or use BrainTrust)?
const expectedFile:
  | string
  | undefined = `${baseDir}/samples/aws-events/connection/output/src/connection.ts`;

const sample = Sample.fromName("aws-events/event-bus/src");
const newInput = fs.readFileSync(newInputRequest.inputFile, "utf8");

// Ref: https://platform.openai.com/docs/guides/prompt-engineering
// TODO: Add TerraConstructs core Declaration files
// TODO: Should the examples be in the system prompt?
const instructions = [
  "Convert a given TypeScript code using AWS CDK to CDKTF, following specified guidance and examples.",
  "Ensure the output is a valid source code file that can be directly written to disk.",
  "Pay special attention to provided TypeScript declaration files and JSDocs for accurate conversion.\n",
  "\n## Conversion Guidelines\n\n",
  " - Use the provided TypeScript declaration files and JSDocs as a primary reference for conversion.\n",
  " - Follow the provided examples closely to maintain consistency in the conversion process.\n",
  "## Reference Documents\n\n",
  "**AWS CDK Type Declarations:**\n",
  "```typescript\n" + sample.inputRef + "```\n",
  "\n**CDKTF Type Declarations:**:\n",
  "```typescript\n" + sample.outputRefs + "```\n",
  "\n## Steps\n\n",
  "1. **Review Input**: Examine the provided TypeScript code using AWS CDK Constructs (prefixed with Cfn..).\n",
  "2. **Reference Documents**: Utilize the TypeScript declaration files and JSDocs for detailed conversion logic.\n",
  "3. **Convert Syntax**: Translate AWS CDK constructs into their CDKTF equivalents.\n",
  "4. **Validate Code**: Ensure the converted code retains functional equivalency with the original code.\n",
  "5. **Output Code**: Prepare the final converted TypeScript source code formatted for CDKTF.\n",
  "\n## Output Format\n\n",
  "- Generate a TypeScript source code file (.ts) formatted for CDKTF.\n",
  "- Ensure the file is syntactically correct and ready for writing to disk.\n",
  "\n## Examples\n\n",
  "**Example 1:**\n",
  "**Input**:\n",
  "```typescript\n" + sample.input + "\n```\n\n",
  "**Conversion**:\n",
  "```typescript\n" + sample.output + "\n```\n\n",
  "\n## Notes\n\n",
  "- Ensure all necessary imports and dependencies are correctly referenced for CDKTF.\n",
  "- Pay attention to any special conversion nuances outlined in the examples, such as specific method or property differences between AWS CDK and CDKTF.\n",
  "- Leverage existing conversion patterns from provided examples for uniformity in approach.",
].join("");
const userPrompt = [
  "Convert the following TypeScript code using AWS CDK to CDKTF.",
  "```typescript\n" + newInput + "```\n",
].join();

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * The Maximum Tokens before Cut-off
 *
 * Use this to control cost
 */
const modelMaxTokens = maxOutputTokens(model);
const [instructionTokens, userPromptTokens] = calucateTokens(
  model,
  instructions,
  userPrompt
);
const currentTokens = instructionTokens! + userPromptTokens!;
const tokenSummaries = [
  `Instruction Tokens: ${paddedHumanNumber(instructionTokens)}`,
  `User Prompt Tokens: ${paddedHumanNumber(userPromptTokens)}`,
];
// OpenAI recommends reserving at least 25,000
let expectedOutputTokens = 25_000;
if (expectedFile) {
  const expectedOutput = fs.readFileSync(expectedFile, "utf8");
  // NOTE: this does not include the tokens consumed by reasoning models...
  expectedOutputTokens = calucateTokens(model, expectedOutput)[0]!;
  tokenSummaries.push(
    `Expected Tokens:    ${paddedHumanNumber(expectedOutputTokens)}\n`
  );
}
tokenSummaries.push(
  `Total Tokens:       ${paddedHumanNumber(
    currentTokens + expectedOutputTokens
  )}`
);
tokenSummaries.push(
  `Model Max Tokens:   ${paddedHumanNumber(modelMaxTokens)}\n`
);

process.stdout.write(tokenSummaries.join("\n"));
if (currentTokens + expectedOutputTokens > modelMaxTokens) {
  process.stdout.write(
    `\nError: This prompt is likely to exceed the maximum tokens allowed for the model.\n`
  );
  process.stdout.write(
    `Please revise the prompts, compress the inputs or use a model with a higher token limit.\n`
  );
  process.exit(1);
  // throw new Error(
  //   `This prompt is likely to exceed the maximum tokens allowed for the model.`
  // );
}

/**
 * OpenAI roles
 *
 * system: messages added by OpenAI
 *
 * developer                                user                                assistant
 *
 * developer messages are instructions      user messages are instructions      Messages generated by the model
 * provided by the application developer,   provided by an end user, weighted   have the assistant role.
 * weighted ahead of user messages.	        behind developer messages.
 *
 * See: https://model-spec.openai.com/2025-02-12.html#chain_of_command
 */

const inputFileName = path.relative(process.cwd(), newInputRequest.inputFile);
const spinner = ora(`Converting ${inputFileName}`).start();
const startTime = performance.now();
const response = await openai.responses.create({
  model,
  instructions,
  input: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: userPrompt,
        },
      ],
    },
  ],
  text: {
    format: {
      type: "text",
    },
  },
  max_output_tokens: modelMaxTokens,
  ...(isReasoningModel(model)
    ? {
        // add reasoning effort for models that support it
        reasoning: {
          effort: reasoningEffort,
        },
      }
    : {}),
  tools: [],
  temperature: 1,
  store: true,
  // stream: true,
});

const endTime = performance.now();
const responseTime = (endTime - startTime) / 1000; // Convert to seconds
spinner.stop();

// // TODO: Adopt https://platform.openai.com/docs/guides/streaming-responses?api-mode=responses
// for await (const event of stream) {
//   console.log(event);
// }

// print Actual Usage
process.stdout.write(`Response Time: ${responseTime.toFixed(2)}s\n`);
process.stdout.write(
  `Actual Usage: ${JSON.stringify(response.usage, null, 2)}\n`
);

// Create output directory if it doesn't exist
const outputDir = path.dirname(newInputRequest.responseFile);
fs.mkdirSync(outputDir, { recursive: true });

// // TODO: Use structured outputs to get code files
// // https://platform.openai.com/docs/guides/structured-outputs?api-mode=responses
// // Extract and save the code to a .ts file if found
// const code = extractCode(response.output_text);
// if (code) {
//   const tsFilePath = newInputRequest.responseFile.replace(".md", ".ts");
//   fs.writeFileSync(tsFilePath, code, "utf8");
//   process.stdout.write(`\nCode saved to: ${tsFilePath}\n`);
// }

const result = [
  "# Conversion Response\n",
  `Selected Model: [${model}](https://platform.openai.com/docs/models/${model})\n`,
  "## Metadata\n",
  "### Token Summary",
  "```",
  tokenSummaries.join("\n"),
  "```\n",
  "### Response Statistics",
  "```",
  `Response Time: ${responseTime.toFixed(2)}s`,
  "Actual Usage:",
  JSON.stringify(response.usage, null, 2),
  "```\n",
  "### Links",
  `[View in OpenAI Dashboard](https://platform.openai.com/logs/${response.id})\n`,
  "## Response\n",
  response.output_text,
].join("\n");

fs.writeFile(newInputRequest.responseFile, result, "utf8", (err) => {
  if (err) {
    throw err;
  }
});

// process.stdout.write(response.output_text);
process.stdout.write(
  `\nConversion Response saved to: ${newInputRequest.responseFile}\n`
);

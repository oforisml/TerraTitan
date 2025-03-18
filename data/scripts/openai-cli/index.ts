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
  calculateTokens,
  getDateSuffix,
  forHuman,
  extractCode,
} from "./util/helpers";
import { OPENAI_MODEL, maxOutputTokens, isReasoningModel } from "./util/models";
import { Sample } from "./util/samples";
import { LibRef } from "./util/ref";
// path to data/ directory
const baseDir = `${__dirname}/../..`;

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
let reasoningEffort: OpenAI.ReasoningEffort = "medium";
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

if (isDryRun) {
  process.stdout.write("Running in dry-run mode - no API calls will be made\n");
}

const model = OPENAI_MODEL.O3_MINI;
reasoningEffort = "high";
const modelDescription = isReasoningModel(model)
  ? `${model} (${reasoningEffort})`
  : model;
process.stdout.write(`Selected Model: ${modelDescription}\n`);

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
const libRef = LibRef.terraConstructs();
const newInput = fs.readFileSync(newInputRequest.inputFile, "utf8");

const templatePath = path.join(__dirname, "prompts", "instructions-v1.md");
const instructionTemplate = fs.readFileSync(templatePath, "utf8");

// TODO: Improve on prompts
// Ref: https://platform.openai.com/docs/guides/prompt-engineering
// TODO: Should the examples be in the system prompt?
const instructions = instructionTemplate
  .replace("{{core}}", libRef.core)
  .replace("{{aws}}", libRef.aws)
  .replace("{{inputRef}}", sample.inputRef)
  .replace("{{outputRefs}}", sample.outputRefs)
  .replace("{{input}}", sample.input)
  .replace("{{output}}", sample.output);

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
const [instructionTokens, userPromptTokens] = calculateTokens(
  model,
  instructions,
  userPrompt
);
const currentTokens = instructionTokens! + userPromptTokens!;
const tokenSummaries = [
  `Instruction Tokens: ${forHuman(instructionTokens)}`,
  `User Prompt Tokens: ${forHuman(userPromptTokens)}`,
];
// OpenAI recommends reserving at least 25,000
let expectedOutputTokens = 25_000;
if (expectedFile) {
  const expectedOutput = fs.readFileSync(expectedFile, "utf8");
  // NOTE: this does not include the tokens consumed by reasoning models...
  expectedOutputTokens = calculateTokens(model, expectedOutput)[0]!;
  tokenSummaries.push(
    `Expected Tokens:    ${forHuman(expectedOutputTokens)}\n`
  );
}
tokenSummaries.push(
  `Total Tokens:       ${forHuman(currentTokens + expectedOutputTokens)}`
);
tokenSummaries.push(`Model Max Tokens:   ${forHuman(modelMaxTokens)}\n`);

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

if (isDryRun) {
  process.stdout.write("Dry-run mode - skipping API call\n");
  // write the prompt to a file
  const promptFile = `./responses/prompt-${getDateSuffix()}.md`;
  fs.writeFileSync(promptFile, instructions + "\n" + userPrompt, "utf8");
  process.stdout.write(`Prompt saved to: ${promptFile}\n`);
  process.exit(0);
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
  `Selected Model: [${modelDescription}](https://platform.openai.com/docs/models/${model})\n`,
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

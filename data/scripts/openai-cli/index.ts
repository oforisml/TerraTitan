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
import {
  calculateTokens,
  getDateSuffix,
  forHuman,
  extractCode,
} from "./util/helpers";
import { OPENAI_MODEL, maxOutputTokens, isReasoningModel } from "./util/models";
import { Message } from "./prompts";
import { Sample } from "./util/samples";
import { LibRef } from "./util/ref";
import { ConversionRequest } from "./util/request";
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

// get prepared sample data and TerraConstructs Library references
const sample1 = Sample.fromName("aws-events/event-bus/src");
const sample2 = Sample.fromName("aws-kinesis/stream/src");
const libRef = LibRef.terraConstructs();

// TODO: Improve on the actual prompts
// Ref: https://platform.openai.com/docs/guides/prompt-engineering
const instructions = Message.instructions.render({
  core: libRef.core,
  aws: libRef.aws,
  // TODO: Should the examples be in the system prompt?
  sampleInputRef: sample1.inputRef,
  sampleOutputRefs: sample1.outputRefs,
  sampleInput: sample1.input,
  sampleOutput: sample1.output,
});

// simulate 1 previous conversation for the model to follow
const sampleInputRequest = sample2.toSampleRequest();
const userPrompt = Message.user;
const sampleInput = userPrompt.render({
  input: sampleInputRequest.input,
  inputRef: sampleInputRequest.inputRef,
  outputRefs: sampleInputRequest.outputRefs,
});
const assistantSample = Message.assistantSample;
const sampleResponse = assistantSample.render({
  output: sample2.output,
});

// Create a new Conversion Request
const newInputRequest = new ConversionRequest({
  inputFile: `${baseDir}/samples/aws-events/connection/input/src/connection.ts`,
  // TODO: Filter down to just the relevant classes/interfaces?
  inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,
  outputRefFiles: [
    // Note: created by running bun scripts/merge-docs/index.ts!
    `${baseDir}/reference/merged/provider-aws/cloudwatch-event-connection/index.d.ts`,
  ],
  // For token estimates...
  expectedFile: `${baseDir}/samples/aws-events/connection/output/src/connection.ts`,
  responseFile: `./responses/connection-response-${getDateSuffix()}.md`,
});
const newInput = userPrompt.render({
  input: newInputRequest.input,
  inputRef: newInputRequest.inputRef,
  outputRefs: newInputRequest.outputRefs,
});

/// TOKEN CALCULATIONS

/**
 * The Maximum Tokens before Cut-off
 *
 * Use this to control cost
 */
const modelMaxTokens = maxOutputTokens(model);
const [
  instructionTokens,
  // simulated interaction
  user1InputTokens,
  assistant1OutpuTokens,
  // new request
  newRequestTokens,
] = calculateTokens(model, instructions, sampleInput, sampleResponse, newInput);
// keep track of how many tokens this simulation already uses
const currentTokens =
  instructionTokens! +
  newRequestTokens! +
  user1InputTokens! +
  assistant1OutpuTokens!;

const tokenSummaries = [
  `Instruction Tokens:                  ${forHuman(instructionTokens)}`,
  `Simulated User Prompt Tokens:        ${forHuman(user1InputTokens)}`,
  `Simulated Assistent Response Tokens: ${forHuman(assistant1OutpuTokens)}`,
  `New User Prompt Tokens:              ${forHuman(newRequestTokens)}`,
];

// OpenAI recommends reserving at least 25,000 (for reasoning and output generation)
let expectedOutputTokens = 25_000;
if (newInputRequest.expected) {
  // caluclate a conservative estimate of the expected token usage
  expectedOutputTokens = calculateTokens(model, newInputRequest.expected)[0]!;
  if (isReasoningModel(model)) {
    // also reserve 5,000 tokens for reasoning
    expectedOutputTokens += 5_000;
  }
  tokenSummaries.push(
    `Expected Tokens:                     ${forHuman(expectedOutputTokens)}\n`
  );
}
tokenSummaries.push(
  `Total Tokens:                        ${forHuman(
    currentTokens + expectedOutputTokens
  )}`
);
tokenSummaries.push(
  `Model Max Tokens:                    ${forHuman(modelMaxTokens)}\n`
);

process.stdout.write(tokenSummaries.join("\n"));
const likelyExceedsMaxTokens =
  currentTokens + expectedOutputTokens > modelMaxTokens;

if (isDryRun) {
  process.stdout.write("Dry-run mode - skipping API call\n");
  // write the dry-run prompt to a file for review
  const promptFile = `./responses/prompt-${getDateSuffix()}.md`;
  fs.writeFileSync(
    promptFile,
    [
      "# Dry-run Prompt",
      "## Metadata",
      "### Token Summary",
      "```",
      tokenSummaries.join("\n"),
      "```",
      "## Instructions",
      instructions,
      "## Simulated User Prompt",
      sampleInput,
      "## Simulated Assistant Response",
      sampleResponse,
      "## New User Prompt",
      newInput,
    ].join("\n"),
    "utf8"
  );
  if (likelyExceedsMaxTokens) {
    process.stdout.write(
      `\nERROR: This prompt is likely to exceed the maximum tokens allowed for the model.\n`
    );
  }
  process.stdout.write(`Prompt saved to: ${promptFile}\n`);
  process.exit(0);
}

// Exit if the prompt is likely to exceed the maximum tokens allowed for the model
if (likelyExceedsMaxTokens) {
  process.stdout.write(
    `\nError: This prompt is likely to exceed the maximum tokens allowed for the model.\n`
  );
  process.stdout.write(
    `Please revise the prompts, compress the inputs or use a model with a higher token limit.\n`
  );
  process.exit(1);
}

/// ACTUAL OPENAI API CALL

dotenv.config();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
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

const spinner = ora(`Converting ${newInputRequest.inputFileName}`).start();
const startTime = performance.now();
const response = await openai.responses.create({
  model,
  instructions,
  input: [
    // simulate a user interaction for the model to follow
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: sampleInput,
        },
      ],
    },
    {
      // id: "", // specifying an invalid ID causes an API Error :(
      status: "completed",
      type: "message",
      role: "assistant",
      content: [
        {
          type: "output_text",
          text: sampleResponse,
          annotations: [],
        },
      ],
    } as any, // ignore annoying typescript error on missing "id" field...
    // now prompt the new input
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: newInput,
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

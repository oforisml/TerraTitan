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
} from "../util/helpers";
import {
  OPENAI_MODEL,
  maxOutputTokens,
  isReasoningModel,
} from "../util/models";
import {
  loadTemplates,
  type PromptTemplateNames,
  type PromptTemplates,
} from "../prompts";
import { ConversionType, type ConversionRequestsBase } from "../util/types";
import { Sample } from "../util/samples";
import { LibRef } from "../util/ref";
import { ConversionRequest } from "../util/request";

export interface BasicFlowProps {
  /**
   * The OpenAI model to use
   *
   * @default OPENAI_MODEL.O3_MINI
   */
  model?: OPENAI_MODEL;
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
   *
   * @default "medium"
   */
  reasoningEffort?: OpenAI.ReasoningEffort;
  /**
   * Conversion of a source code file or a unit test
   */
  type: ConversionType;
  /**
   * If true, the script will not make any API calls
   *
   * @default false
   */
  isDryRun?: boolean;
  /**
   * Which Sample to use for the conversion
   */
  sampleNames: string[];
  /**
   * The prompt Templates to use
   *
   * @default { instructions: "instructions-v1", userPrompt: "user-prompt-v1", assistantSample: "assistant-sample-v1" }
   */
  promptTemplateNames?: PromptTemplateNames;
}

/**
 * Versy basic Conversion Flow:
 *
 * 1. Load the Sample data
 * 2. Load the Prompt Templates
 * 3. Run the Conversion
 * 4. Save the response
 *
 */
export class BasicFlow {
  private readonly _model: OPENAI_MODEL;
  private readonly _reasoningEffort: OpenAI.ReasoningEffort;
  private readonly _isDryRun: boolean;
  private readonly _type: ConversionType;
  private readonly _samples: Sample[];
  private readonly _libRef: LibRef;
  private readonly _promptTemplates: PromptTemplates;

  constructor(props: BasicFlowProps) {
    this._model = props.model || OPENAI_MODEL.O3_MINI;
    this._reasoningEffort = props.reasoningEffort || "medium";
    this._isDryRun = props.isDryRun || false;
    this._type = props.type;

    // get prepared sample data and TerraConstructs Library references
    if (props.sampleNames.length < 2) {
      throw new Error("At least 2 samples are required");
    }
    this._samples = props.sampleNames.map((name) => Sample.fromName(name));
    this._libRef = LibRef.terraConstructs(this._type);

    // load prompt templates
    const promptTemplateNames = props.promptTemplateNames || {
      instructions: "instructions-v1",
      userPrompt: "user-prompt-v1",
      assistantSample: "assistant-sample-v1",
    };
    this._promptTemplates = loadTemplates(promptTemplateNames, this._type);
  }

  async run(request: ConversionRequestsBase) {
    if (this._isDryRun) {
      process.stdout.write(
        "Running in dry-run mode - no API calls will be made\n"
      );
    }
    const modelDescription = isReasoningModel(this._model)
      ? `${this._model} (${this._reasoningEffort})`
      : this._model;
    process.stdout.write(`Selected Model: ${modelDescription}\n`);

    // get prepared sample data and TerraConstructs Library references
    const sample1 = this._samples[0]!;
    const sample2 = this._samples[1]!;

    // TODO: Improve on the actual prompts
    // Ref: https://platform.openai.com/docs/guides/prompt-engineering
    const instructions = this._promptTemplates.instructions.render({
      core: this._libRef.core,
      aws: this._libRef.aws,
      testing: this._libRef.testing,
      // TODO: Should the examples be in the system prompt?
      sampleInputRef: sample1.inputRef,
      sampleOutputRefs: sample1.outputRefs,
      sampleInput: sample1.input,
      sampleOutput: sample1.output,
    });

    // simulate 1 previous conversation for the model to follow
    const sampleInputRequest = sample2.toSampleRequest();
    const sampleInput = this._promptTemplates.user.render({
      input: sampleInputRequest.input,
      inputRef: sampleInputRequest.inputRef,
      outputRefs: sampleInputRequest.outputRefs,
    });
    const sampleResponse = this._promptTemplates.assistantSample.render({
      output: sample2.output,
    });

    // Create a new Conversion Request
    const newInputRequest = new ConversionRequest({
      type: this._type,
      ...request,
    });
    const newInput = this._promptTemplates.user.render({
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
    const modelMaxTokens = maxOutputTokens(this._model);
    const [
      instructionTokens,
      // simulated interaction
      user1InputTokens,
      assistant1OutpuTokens,
      // new request
      newRequestTokens,
    ] = calculateTokens(
      this._model,
      instructions,
      sampleInput,
      sampleResponse,
      newInput
    );
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
      expectedOutputTokens = calculateTokens(
        this._model,
        newInputRequest.expected
      )[0]!;
      if (isReasoningModel(this._model)) {
        // also reserve 5,000 tokens for reasoning
        expectedOutputTokens += 5_000;
      }
      tokenSummaries.push(
        `Expected Tokens:                     ${forHuman(
          expectedOutputTokens
        )}\n`
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

    if (this._isDryRun) {
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
      model: this._model,
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
      ...(isReasoningModel(this._model)
        ? {
            // add reasoning effort for models that support it
            reasoning: {
              effort: this._reasoningEffort,
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
      `Selected Model: [${modelDescription}](https://platform.openai.com/docs/models/${this._model})\n`,
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
  }
}

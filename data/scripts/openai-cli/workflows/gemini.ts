import {
  GenerateContentResponse,
  GoogleGenAI,
  type GenerateContentConfig,
} from "@google/genai";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import ora from "ora";
import dotenv from "dotenv";
import { getDateSuffix } from "../util/helpers";
import { GEMINI_MODEL } from "../util/models";
import { Sample } from "../util/samples";
import { LibRef } from "../util/ref";
import {
  loadTemplates,
  type PromptTemplateNames,
  type PromptTemplates,
} from "../prompts";
import { ConversionType, type ConversionRequestsBase } from "../util/types";
import { ConversionRequest } from "../util/request";

// partial interface for Google genai Generate Text API
export interface GenerationConfig {
  /** Value that controls the degree of randomness in token selection.
     Lower temperatures are good for prompts that require a less open-ended or
     creative response, while higher temperatures can lead to more diverse or
     creative results.
     */
  temperature?: number;
  /** Tokens are selected from the most to least probable until the sum
      of their probabilities equals this value. Use a lower value for less
      random responses and a higher value for more random responses.
      */
  topP?: number;
  /** For each token selection step, the ``top_k`` tokens with the
      highest probabilities are sampled. Then tokens are further filtered based
      on ``top_p`` with the final token selected using temperature sampling. Use
      a lower number for less random responses and a higher number for more
      random responses.
      */
  topK?: number;
  /** Number of response variations to return.
   */
  candidateCount?: number;
  /** Maximum number of tokens that can be generated in the response.
   */
  maxOutputTokens?: number;
}

export interface GeminiFlowProps {
  /**
   * The OpenAI model to use
   *
   * @default OPENAI_MODEL.O3_MINI
   */
  model?: GEMINI_MODEL;
  /**
   * The Gemini Generation Config
   */
  generationConfig: GenerationConfig;
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
   * @default - { instructions: "instructions-v1", userPrompt: "user-prompt-v1", assistantSample: "assistant-sample-v1" }
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
export class GeminiFlow {
  private readonly _model: GEMINI_MODEL;
  private readonly _isDryRun: boolean;
  private readonly _type: ConversionType;
  private readonly _samples: Sample[];
  private readonly _libRef: LibRef;
  private readonly _promptTemplates: PromptTemplates;
  private readonly _generationConfig: GenerationConfig;

  constructor(props: GeminiFlowProps) {
    this._model = props.model || GEMINI_MODEL.GEMINI_2_5_PRO_EXP_03_25;
    this._generationConfig = props.generationConfig;
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
    const modelDescription = this._model;
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

    // Create output directory if it doesn't exist
    const outputDir = path.join(
      path.dirname(newInputRequest.responseFile),
      `gemini-${getDateSuffix()}`
    );
    fs.mkdirSync(outputDir, { recursive: true });
    dotenv.config();

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    /// TOKEN CALCULATIONS

    // /**
    //  * The Maximum Tokens before Cut-off
    //  *
    //  * Use this to control cost
    //  */
    // const modelMaxTokens = maxOutputTokens(this._model);
    // const [
    //   instructionTokens,
    //   // simulated interaction
    //   user1InputTokens,
    //   assistant1OutpuTokens,
    //   // new request
    //   newRequestTokens,
    // ] = calculateTokens(
    //   this._model,
    //   instructions,
    //   sampleInput,
    //   sampleResponse,
    //   newInput
    // );
    // // keep track of how many tokens this simulation already uses
    // const currentTokens =
    //   instructionTokens! +
    //   newRequestTokens! +
    //   user1InputTokens! +
    //   assistant1OutpuTokens!;

    // const tokenSummaries = [
    //   `Instruction Tokens:                  ${forHuman(instructionTokens)}`,
    //   `Simulated User Prompt Tokens:        ${forHuman(user1InputTokens)}`,
    //   `Simulated Assistent Response Tokens: ${forHuman(assistant1OutpuTokens)}`,
    //   `New User Prompt Tokens:              ${forHuman(newRequestTokens)}`,
    // ];

    // // OpenAI recommends reserving at least 25,000 (for reasoning and output generation)
    // let expectedOutputTokens = 25_000;
    // if (newInputRequest.expected) {
    //   // caluclate a conservative estimate of the expected token usage
    //   expectedOutputTokens = calculateTokens(
    //     this._model,
    //     newInputRequest.expected
    //   )[0]!;
    //   if (isReasoningModel(this._model)) {
    //     // also reserve 5,000 tokens for reasoning
    //     expectedOutputTokens += 5_000;
    //   }
    //   tokenSummaries.push(
    //     `Expected Tokens:                     ${forHuman(
    //       expectedOutputTokens
    //     )}\n`
    //   );
    // }
    // tokenSummaries.push(
    //   `Total Tokens:                        ${forHuman(
    //     currentTokens + expectedOutputTokens
    //   )}`
    // );
    // tokenSummaries.push(
    //   `Model Max Tokens:                    ${forHuman(modelMaxTokens)}\n`
    // );

    // process.stdout.write(tokenSummaries.join("\n"));
    // const likelyExceedsMaxTokens =
    //   currentTokens + expectedOutputTokens > modelMaxTokens;

    if (this._isDryRun) {
      process.stdout.write("Dry-run mode - skipping API call\n");
      // write the dry-run prompt to a file for review
      const promptFile = path.join(outputDir, `prompt-${getDateSuffix()}.md`);
      fs.writeFileSync(
        promptFile,
        [
          "# Dry-run Prompt",
          "## Metadata",
          // "### Token Summary",
          // "```",
          // tokenSummaries.join("\n"),
          // "```",
          "### generation config",
          "```",
          JSON.stringify(this._generationConfig, null, 2),
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
      // if (likelyExceedsMaxTokens) {
      //   process.stdout.write(
      //     `\nERROR: This prompt is likely to exceed the maximum tokens allowed for the model.\n`
      //   );
      // }
      process.stdout.write(`Prompt saved to: ${promptFile}\n`);
      process.exit(0);
    }
    // // Exit if the prompt is likely to exceed the maximum tokens allowed for the model
    // if (likelyExceedsMaxTokens) {
    //   process.stdout.write(
    //     `\nError: This prompt is likely to exceed the maximum tokens allowed for the model.\n`
    //   );
    //   process.stdout.write(
    //     `Please revise the prompts, compress the inputs or use a model with a higher token limit.\n`
    //   );
    //   process.exit(1);
    // }

    /// ACTUAL Gemini API CALL
    const spinner = ora(`Converting ${newInputRequest.inputFileName}`).start();
    const startTime = performance.now();
    let result: GenerateContentResponse | undefined;
    try {
      result = await ai.models.generateContent({
        model: this._model,
        config: {
          ...this._generationConfig,
          systemInstruction: instructions,
        },
        // POSSIBLE_ROLES: readonly ["user", "model", "function", "system"];
        contents: [
          // simulate a user interaction for the model to follow
          {
            role: "user",
            parts: [{ text: sampleInput }],
          },
          {
            role: "model",
            parts: [{ text: sampleResponse }],
          },
          // now prompt the new input
          {
            role: "user",
            parts: [{ text: newInput }],
          },
        ],
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        spinner.fail(`Conversion failed: ${err.message}`);
      } else {
        spinner.fail("Conversion failed: Unknown error occurred");
      }
      process.exit(1);
    }
    // TODO: Following code needs to be updated for client-side apps.
    const endTime = performance.now();
    const responseTime = (endTime - startTime) / 1000; // Convert to seconds
    const candidates = result.candidates;
    if (!candidates) {
      spinner.fail("No candidates found");
      return;
    }
    spinner.succeed(`Conversion completed in ${responseTime}ms`);

    // print Actual Usage
    process.stdout.write(`Response Time: ${responseTime.toFixed(2)}s\n`);
    process.stdout.write(
      `Actual Usage: ${JSON.stringify(result.usageMetadata, null, 2)}\n`
    );
    for (
      let candidate_index = 0;
      candidate_index < candidates.length;
      candidate_index++
    ) {
      for (
        let part_index = 0;
        part_index < candidates[candidate_index]!.content!.parts!.length;
        part_index++
      ) {
        const part = candidates[candidate_index]!.content!.parts![part_index]!;
        if (part.inlineData) {
          try {
            const filename = path.join(
              outputDir,
              `output_${candidate_index}_${part_index}.${mime.extension(part.inlineData!.mimeType!)}`
            );
            fs.writeFileSync(
              filename,
              Buffer.from(part.inlineData!.data!, "base64")
            );
            console.log(`Output written to: ${filename}`);
          } catch (err) {
            console.error(err);
          }
        } else if (part.text) {
          const filename = path.join(
            outputDir,
            `output_${candidate_index}_${part_index}.md`
          );
          fs.writeFileSync(filename, part.text);
          console.log(`Output written to: ${filename}`);
        } else {
          console.error("No output found");
          console.log(
            `${candidate_index}:${part_index}:${JSON.stringify(part)}`
          );
        }
      }
    }

    const summary = [
      "# Conversion Response\n",
      `Selected Model: [${modelDescription}](https://ai.google.dev/gemini-api/docs/models#${this._model})\n`,
      "## Metadata\n",
      // "### Token Summary",
      // "```",
      // tokenSummaries.join("\n"),
      // "```\n",
      "### generation config",
      "```",
      JSON.stringify(this._generationConfig, null, 2),
      "```",
      "### Response Statistics",
      "```",
      `Response Time: ${responseTime.toFixed(2)}s`,
      "Actual Usage:",
      JSON.stringify(result.usageMetadata, null, 2),
      "```\n",
      // "### Links",
      // `[View in OpenAI Dashboard](https://platform.openai.com/logs/${response.id})\n`,
      // "## Response\n",
      // response.output_text,
    ].join("\n");
    const summaryFilename = path.join(outputDir, `summary.md`);
    fs.writeFile(summaryFilename, summary, "utf8", (err) => {
      if (err) {
        throw err;
      }
    });

    // process.stdout.write(response.output_text);
    process.stdout.write(`\nConversion Summary saved to: ${summaryFilename}\n`);
  }
}

import { BasicFlow, GeminiFlow } from "./workflows";
import { OPENAI_MODEL, GEMINI_MODEL } from "./util/models";
import { ConversionType } from "./util/types";
import { getDateSuffix } from "./util/helpers";
import { sourceRequests, unitRequests } from "./requests";

// path to data/ directory
const baseDir = `${__dirname}/../..`;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

// const sourceFlow = new BasicFlow({
//   model: OPENAI_MODEL.O3_MINI,
//   reasoningEffort: "high",
//   type: ConversionType.SOURCE,
//   sampleNames: ["aws-events/event-bus/src", "aws-kinesis/stream/src"],
//   isDryRun,
// });

const geminiSourceFlow = new GeminiFlow({
  model: GEMINI_MODEL.GEMINI_2_5_PRO_PREVIEW_03_25,
  generationConfig: {
    temperature: 0,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 65536,
  },
  type: ConversionType.SOURCE,
  sampleNames: ["aws-events/event-bus/src", "aws-kinesis/stream/src"],
  isDryRun,
});

// const sourceToConvert = sourceRequests["aws-events/connection"]!;
// const sourceToConvert = sourceRequests["aws-iam/user"]!; // 0321115312
// const sourceToConvert = sourceRequests["aws-iam/group"]!; // 0321140052
// const sourceToConvert = sourceRequests["aws-sns/topic"]!; // 0322100052
// const sourceToConvert = sourceRequests["aws-sns/topic-base"]!; //
// void sourceFlow.run({
//   inputFile: `${baseDir}/${sourceToConvert.inputFile}`,
//   inputRefFiles: sourceToConvert.inputRefFiles.map((f) => `${baseDir}/${f}`),
//   outputRefFiles: sourceToConvert.outputRefFiles.map((f) => `${baseDir}/${f}`),
//   responseFile: `${sourceToConvert.responseFile}-${getDateSuffix()}.md`,
//   expectedFile: sourceToConvert.expectedFile
//     ? `${baseDir}/${sourceToConvert.expectedFile}`
//     : undefined,
// });

const sourceToConvert = sourceRequests["aws-sns/topic-base"]!; //
void geminiSourceFlow.run({
  inputFile: `${baseDir}/${sourceToConvert.inputFile}`,
  inputRefFiles: sourceToConvert.inputRefFiles.map((f) => `${baseDir}/${f}`),
  outputRefFiles: sourceToConvert.outputRefFiles.map((f) => `${baseDir}/${f}`),
  responseFile: `${sourceToConvert.responseFile}-${getDateSuffix()}.md`,
  expectedFile: sourceToConvert.expectedFile
    ? `${baseDir}/${sourceToConvert.expectedFile}`
    : undefined,
});

// const unitFlow = new BasicFlow({
//   model: OPENAI_MODEL.O3_MINI,
//   reasoningEffort: "high",
//   type: ConversionType.UNIT,
//   sampleNames: ["aws-events/event-bus/test", "aws-kinesis/stream/test"],
//   isDryRun,
// });

// // const unitToConvert = unitRequests["aws-events/connection"]!;
// // const unitToConvert = unitRequests["aws-iam/user"]!;
// // const unitToConvert = unitRequests["aws-iam/group"]!;
// const unitToConvert = unitRequests["aws-sns/topic"]!;
// // const unitToConvert = unitRequests["aws-sns/subscription"]!;
// void unitFlow.run({
//   inputFile: `${baseDir}/${unitToConvert.inputFile}`,
//   inputRefFiles: unitToConvert.inputRefFiles.map((f) => `${baseDir}/${f}`),
//   outputRefFiles: unitToConvert.outputRefFiles.map((f) => `${baseDir}/${f}`),
//   responseFile: `${unitToConvert.responseFile}-${getDateSuffix()}.md`,
//   expectedFile: unitToConvert.expectedFile
//     ? `${baseDir}/${unitToConvert.expectedFile}`
//     : undefined,
// });

/**
 * Sample implementation of Conversion CLI using OpenAI Responses API
 *
 * Ref: https://cookbook.openai.com/examples/responses_api/responses_example
 */
import { BasicFlow } from "./workflows";
import { OPENAI_MODEL } from "./util/models";
import { ConversionType } from "./util/types";
import { getDateSuffix } from "./util/helpers";

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

// void sourceFlow.run({
//   inputFile: `${baseDir}/samples/aws-events/connection/input/src/connection.ts`,
//   // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
//   inputRefFile: `${baseDir}/reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,
//   outputRefFiles: [
//     // Note: created by running bun scripts/merge-docs/index.ts!
//     `${baseDir}/reference/merged/provider-aws/cloudwatch-event-connection/index.d.ts`,
//   ],
//   // For token estimates...
//   expectedFile: `${baseDir}/samples/aws-events/connection/output/src/connection.ts`,
//   responseFile: `./responses/connection-response-${getDateSuffix()}.md`,
// });

const unitFlow = new BasicFlow({
  model: OPENAI_MODEL.O3_MINI,
  reasoningEffort: "high",
  type: ConversionType.UNIT,
  sampleNames: ["aws-events/event-bus/test", "aws-kinesis/stream/test"],
  isDryRun,
});

void unitFlow.run({
  inputFile: `${baseDir}/samples/aws-events/connection/input/test/connection.test.ts`,
  inputRefFile: `${baseDir}/samples/aws-events/connection/input/declarations/connection.d.ts`,
  outputRefFiles: [
    // Unit Tests use Terraform HCL Markdown docs as reference for testing attributes
    `${baseDir}/reference/docs/provider-aws/r/cloudwatch_event_connection.html.markdown`,
  ],
  responseFile: `./responses/connection-test-response-${getDateSuffix()}.md`,
  // For token estimates...
  expectedFile: `${baseDir}/samples/aws-events/connection/output/test/connection.test.ts`,
});

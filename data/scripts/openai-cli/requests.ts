import { type ConversionRequestsBase } from "./util/types";

/**
 * Unit Test Conversion Requests
 */
export const unitRequests: Record<string, ConversionRequestsBase> = {
  "aws-events/connection": {
    responseFile: `./responses/events-connection-test`,
    inputFile: "samples/aws-events/connection/input/test/connection.test.ts",
    inputRefFiles: [
      "/samples/aws-events/connection/input/declarations/connection.d.ts",
    ],
    outputRefFiles: [
      // Unit Tests use Terraform HCL Markdown docs as reference for testing attributes
      "reference/docs/provider-aws/r/cloudwatch_event_connection.html.markdown",
    ],
    // For token estimates...
    expectedFile:
      "samples/aws-events/connection/output/test/connection.test.ts",
  },
  "aws-sns/topic": {
    responseFile: `./responses/sns-topic-test`,
    inputFile: "samples/aws-sns/topic/input/test/sns.test.ts",
    inputRefFiles: [
      "/samples/aws-sns/topic/input/declarations/topic.d.ts",
      "/samples/aws-sns/topic/input/declarations/topic-base.d.ts",
      "/samples/aws-sns/topic/input/declarations/policy.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/sns_topic.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_policy.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_data_protection_policy.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/topic/output/test/sns.test.ts",
  },
  "aws-sns/subscription": {
    responseFile: `./responses/sns-subscription-test`,
    inputFile: "samples/aws-sns/subscription/input/test/subscription.test.ts",
    inputRefFiles: [
      "/samples/aws-sns/subscription/input/declarations/topic.d.ts",
      "/samples/aws-sns/subscription/input/declarations/topic-base.d.ts",
      "/samples/aws-sns/subscription/input/declarations/policy.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/sns_topic_subscription.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_policy.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
};

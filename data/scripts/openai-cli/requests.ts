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
      "samples/aws-sns/topic/input/declarations/topic.d.ts",
      "samples/aws-sns/topic/input/declarations/topic-base.d.ts",
      "samples/aws-sns/topic/input/declarations/policy.d.ts",
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
      "samples/aws-sns/subscription/input/declarations/policy.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscriber.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription-filter.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/sns_topic_subscription.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_policy.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
  "aws-iam/user": {
    responseFile: `./responses/iam-user-test`,
    inputFile: "samples/aws-iam/user/input/test/user.test.ts",
    inputRefFiles: ["/samples/aws-iam/user/input/declarations/user.d.ts"],
    outputRefFiles: [
      "reference/docs/provider-aws/r/iam_user.html.markdown",
      "reference/docs/provider-aws/r/iam_user_policy.html.markdown",
      "reference/docs/provider-aws/r/iam_user_policy_attachment.html.markdown",
      "reference/docs/provider-aws/r/iam_user_ssh_key.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
  "aws-iam/group": {
    responseFile: `./responses/iam-group-test`,
    inputFile: "samples/aws-iam/group/input/test/group.test.ts",
    inputRefFiles: [
      "/samples/aws-iam/group/input/declarations/group.d.ts",
      "/samples/aws-iam/group/input/declarations/user.d.ts",
      "/samples/aws-iam/group/input/declarations/managed-policy.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/iam_user.html.markdown",
      "reference/docs/provider-aws/r/iam_group_membership.html.markdown",
      // "reference/docs/provider-aws/r/iam_group_policies_exclusive.html.markdown",
      "reference/docs/provider-aws/r/iam_group_policy_attachment.html.markdown",
      // "reference/docs/provider-aws/r/iam_group_policy_attachments_exclusive.html.markdown",
      "reference/docs/provider-aws/r/iam_group_policy.html.markdown",
      "reference/docs/provider-aws/r/iam_group.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
};

export const sourceRequests: Record<string, ConversionRequestsBase> = {
  "aws-events/connection": {
    responseFile: `./responses/connection-response`,
    inputFile: `samples/aws-events/connection/input/src/connection.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      `reference/merged/provider-aws/cloudwatch-event-connection/index.d.ts`,
    ],
    // For token estimates...
    expectedFile: `samples/aws-events/connection/output/src/connection.ts`,
  },
  "aws-iam/user": {
    responseFile: `./responses/iam-user-src`,
    inputFile: `samples/aws-iam/user/input/src/user.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-iam/lib/iam.generated.d.ts`,
    ],
    // NOTE: this was missing iamUserLoginProfile
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/iam-user/index.d.ts",
      "reference/merged/provider-aws/iam-user-policy/index.d.ts",
      "reference/merged/provider-aws/iam-user-policy-attachment/index.d.ts",
      "reference/merged/provider-aws/iam-user-ssh-key/index.d.ts",
      // "reference/merged/provider-aws/iam-user-login-profile/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
  "aws-iam/group": {
    responseFile: `./responses/iam-group-src`,
    inputFile: `samples/aws-iam/group/input/src/group.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-iam/lib/iam.generated.d.ts`,
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/iam-group/index.d.ts",
      "reference/merged/provider-aws/iam-user/index.d.ts",
      "reference/merged/provider-aws/iam-group-membership/index.d.ts",
      "reference/merged/provider-aws/iam-group-policy/index.d.ts",
      "reference/merged/provider-aws/iam-group-policy-attachment/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
  "aws-sns/topic": {
    responseFile: `./responses/sns-topic-src`,
    inputFile: `samples/aws-sns/topic/input/src/topic.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-sns/lib/sns.generated.d.ts`,
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/sns-topic/index.d.ts",
      "reference/merged/provider-aws/sns-topic-data-protection-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-subscription/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
  "aws-sns/topic-base": {
    responseFile: `./responses/sns-topic-base-src`,
    inputFile: `samples/aws-sns/topic/input/src/topic-base.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      // `reference/declarations/aws-cdk-lib/aws-sns/lib/sns.generated.d.ts`,
      "samples/aws-sns/topic/input/declarations/topic.d.ts",
      "samples/aws-sns/topic/input/declarations/topic-base.d.ts",
      "samples/aws-sns/subscription/input/declarations/policy.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscriber.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription-filter.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription.d.ts",
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/sns-topic/index.d.ts",
      "reference/merged/provider-aws/sns-topic-data-protection-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-subscription/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
};

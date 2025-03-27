# Conversion Response

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:                   24,982
Simulated User Prompt Tokens:         15,689
Simulated Assistent Response Tokens:   7,903
New User Prompt Tokens:               11,789
Total Tokens:                         85,363
Model Max Tokens:                    100,000

```

### Response Statistics
```
Response Time: 96.08s
Actual Usage:
{
  "input_tokens": 60440,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 13479,
  "output_tokens_details": {
    "reasoning_tokens": 9088
  },
  "total_tokens": 73919
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67de282689ec8190b36d1ec49c8b02c7013bce8de0784aeb)

## Response

```typescript
import { App, Duration, Testing } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { AwsStack } from "../../../src/aws/aws-stack";
import * as iam from "../../../src/aws/iam";
import * as kms from "../../../src/aws/encryption";
import * as notifications from "../../../src/aws/codestarnotifications";
import {
  Topic,
  TopicPolicy,
  SubscriptionProtocol,
  TracingConfig,
  LoggingProtocol,
  FifoThroughputScope
} from "../../../src/aws/notify/sns-topic";
import { Template } from "../../assertions";

const topicTfResource = Topic.tfResourceType; // e.g. "aws_sns_topic"
const topicPolicyTfResource = TopicPolicy.tfResourceType; // e.g. "aws_sns_topic_policy"

describe("Topic", () => {
  describe("topic tests", () => {
    let app: App;
    let stack: AwsStack;

    beforeEach(() => {
      app = Testing.app();
      // Minimal required stack properties can be passed here.
      stack = new AwsStack(app, "MyStack");
    });

    test("all defaults", () => {
      new Topic(stack, "MyTopic");
      Template.fromStack(stack).resourceCountIs(topicTfResource, 1);
    });

    test("specify topicName", () => {
      new Topic(stack, "MyTopic", {
        topicName: "topicName",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        name: "topicName",
      });
    });

    test("specify displayName", () => {
      new Topic(stack, "MyTopic", {
        displayName: "displayName",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        display_name: "displayName",
      });
    });

    test("specify kmsMasterKey", () => {
      const key = new kms.Key(stack, "CustomKey");
      new Topic(stack, "MyTopic", {
        masterKey: key,
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        kms_master_key_id: stack.resolve(key.keyArn),
      });
    });

    test("specify displayName and topicName", () => {
      new Topic(stack, "MyTopic", {
        topicName: "topicName",
        displayName: "displayName",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        name: "topicName",
        display_name: "displayName",
      });
    });

    test("Adds .fifo suffix when no topicName is passed and fifo is true", () => {
      new Topic(stack, "MyTopic", {
        fifo: true,
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        fifo_topic: true,
        name: "MyTopic.fifo",
      });
    });

    test("specify fifo without .fifo suffix in topicName", () => {
      new Topic(stack, "MyTopic", {
        fifo: true,
        topicName: "topicName",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        fifo_topic: true,
        name: "topicName.fifo",
      });
    });

    test("specify fifo with .fifo suffix in topicName", () => {
      new Topic(stack, "MyTopic", {
        fifo: true,
        topicName: "topicName.fifo",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        fifo_topic: true,
        name: "topicName.fifo",
      });
    });

    test("specify fifo without contentBasedDeduplication", () => {
      new Topic(stack, "MyTopic", {
        fifo: true,
        topicName: "topicName",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        fifo_topic: true,
        name: "topicName.fifo",
        // content_based_deduplication not defined implies false in our construct.
      });
    });

    test("specify fifo with contentBasedDeduplication", () => {
      new Topic(stack, "MyTopic", {
        fifo: true,
        topicName: "topicName",
        contentBasedDeduplication: true,
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        fifo_topic: true,
        name: "topicName.fifo",
        content_based_deduplication: true,
      });
    });

    test("throw with contentBasedDeduplication on non-fifo topic", () => {
      expect(() =>
        new Topic(stack, "MyTopic", {
          contentBasedDeduplication: true,
        })
      ).toThrow(/Content based deduplication can only be enabled for FIFO SNS topics\./);
    });

    test("specify signatureVersion", () => {
      new Topic(stack, "MyTopic", {
        signatureVersion: "2",
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        signature_version: "2",
      });
    });

    test("throw with incorrect signatureVersion", () => {
      expect(() =>
        new Topic(stack, "MyTopic", {
          signatureVersion: "3",
        })
      ).toThrow(/signatureVersion must be "1" or "2", received: "3"/);
    });

    test("throw error when displayName is too long", () => {
      expect(() =>
        new Topic(stack, "MyTopic", {
          displayName: "a".repeat(101),
        })
      ).toThrow(/displayName must be less than or equal to 100 characters, got 101/);
    });

    test("can add a policy to the topic", () => {
      const topic = new Topic(stack, "Topic");
      topic.addToResourcePolicy(
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["sns:*"],
          principals: [new iam.ArnPrincipal("arn")],
        })
      );
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Action": "sns:*"'),
      });
    });

    test("can enforce ssl when creating the topic", () => {
      const topic = new Topic(stack, "Topic", {
        enforceSSL: true,
      });
      topic.addToResourcePolicy(
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["sns:*"],
          principals: [new iam.ArnPrincipal("arn")],
        })
      );
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Sid": "AllowPublishThroughSSLOnly"'),
      });
    });

    test("give publishing permissions", () => {
      const topic = new Topic(stack, "Topic");
      const user = new iam.User(stack, "User");
      topic.grantPublish(user);
      Template.fromStack(stack).hasResourceProperties("aws_iam_policy", {
        policy: expect.stringContaining("sns:Publish"),
      });
    });

    test("give subscribing permissions", () => {
      const topic = new Topic(stack, "Topic");
      const user = new iam.User(stack, "User");
      topic.grantSubscribe(user);
      Template.fromStack(stack).hasResourceProperties("aws_iam_policy", {
        policy: expect.stringContaining("sns:Subscribe"),
      });
    });

    test("TopicPolicy passed document", () => {
      const topic = new Topic(stack, "MyTopic");
      const ps = new iam.PolicyStatement({
        actions: ["service:statement0"],
        principals: [new iam.ArnPrincipal("arn")],
      });
      new TopicPolicy(stack, "topicpolicy", {
        topics: [topic],
        policyDocument: new iam.PolicyDocument({ assignSids: true, statements: [ps] }),
      });
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Sid": "0"'),
        arn: { Ref: expect.stringContaining("MyTopic") },
      });
    });

    test("Add statements to policy", () => {
      const topic = new Topic(stack, "MyTopic");
      const topicPolicy = new TopicPolicy(stack, "TopicPolicy", {
        topics: [topic],
      });
      topicPolicy.document.addStatements(
        new iam.PolicyStatement({
          actions: ["service:statement0"],
          principals: [new iam.ArnPrincipal("arn")],
        })
      );
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Sid": "0"'),
      });
    });

    test("Create topic policy and enforce ssl", () => {
      const topic = new Topic(stack, "MyTopic");
      new TopicPolicy(stack, "TopicPolicy", { topics: [topic], enforceSSL: true });
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Sid": "AllowPublishThroughSSLOnly"'),
      });
    });

    test("topic resource policy includes unique SIDs", () => {
      const topic = new Topic(stack, "MyTopic");
      topic.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ["service:statement0"],
          principals: [new iam.ArnPrincipal("arn")],
        })
      );
      topic.addToResourcePolicy(
        new iam.PolicyStatement({
          actions: ["service:statement1"],
          principals: [new iam.ArnPrincipal("arn")],
        })
      );
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Sid": "0"') && expect.stringContaining('"Sid": "1"'),
      });
    });

    test("fromTopicArn", () => {
      const imported = Topic.fromTopicArn(
        stack,
        "Imported",
        "arn:aws:sns:*:123456789012:my_corporate_topic"
      );
      expect(imported.topicName).toEqual("my_corporate_topic");
      expect(imported.topicArn).toEqual("arn:aws:sns:*:123456789012:my_corporate_topic");
      expect(imported.fifo).toEqual(false);
    });

    test("fromTopicArn fifo", () => {
      const imported = Topic.fromTopicArn(
        stack,
        "Imported",
        "arn:aws:sns:*:123456789012:mytopic.fifo"
      );
      expect(imported.topicName).toEqual("mytopic.fifo");
      expect(imported.topicArn).toEqual("arn:aws:sns:*:123456789012:mytopic.fifo");
      expect(imported.fifo).toEqual(true);
    });

    test("fromTopicAttributes contentBasedDeduplication false", () => {
      const imported = Topic.fromTopicAttributes(stack, "Imported", {
        topicArn: "arn:aws:sns:*:123456789012:mytopic",
      });
      expect(imported.topicName).toEqual("mytopic");
      expect(imported.topicArn).toEqual("arn:aws:sns:*:123456789012:mytopic");
      expect(imported.contentBasedDeduplication).toEqual(false);
    });

    test("fromTopicAttributes contentBasedDeduplication true", () => {
      const imported = Topic.fromTopicAttributes(stack, "Imported", {
        topicArn: "arn:aws:sns:*:123456789012:mytopic.fifo",
        contentBasedDeduplication: true,
      });
      expect(imported.topicName).toEqual("mytopic.fifo");
      expect(imported.topicArn).toEqual("arn:aws:sns:*:123456789012:mytopic.fifo");
      expect(imported.contentBasedDeduplication).toEqual(true);
    });

    test("fromTopicAttributes throws with contentBasedDeduplication on non-fifo topic", () => {
      expect(() =>
        Topic.fromTopicAttributes(stack, "Imported", {
          topicArn: "arn:aws:sns:*:123456789012:mytopic",
          contentBasedDeduplication: true,
        })
      ).toThrow(/Cannot import topic; contentBasedDeduplication is only available for FIFO SNS topics\./);
    });

    test("sets account for imported topic env", () => {
      const imported = Topic.fromTopicArn(
        stack,
        "Imported",
        "arn:aws:sns:us-west-2:123456789012:my-topic"
      );
      expect(imported.env.account).toEqual("123456789012");
    });

    test("sets region for imported topic env", () => {
      const imported = Topic.fromTopicArn(
        stack,
        "Imported",
        "arn:aws:sns:us-west-2:123456789012:my-topic"
      );
      expect(imported.env.region).toEqual("us-west-2");
    });

    test("test metrics", () => {
      const topic = new Topic(stack, "Topic");
      expect(stack.resolve(topic.metricNumberOfMessagesPublished())).toEqual({
        dimensions: { TopicName: { "Fn::GetAtt": [expect.stringContaining("Topic"), "TopicName"] } },
        namespace: "AWS/SNS",
        metricName: "NumberOfMessagesPublished",
        period: Duration.minutes(5),
        statistic: "Sum",
      });
      expect(stack.resolve(topic.metricPublishSize())).toEqual({
        dimensions: { TopicName: { "Fn::GetAtt": [expect.stringContaining("Topic"), "TopicName"] } },
        namespace: "AWS/SNS",
        metricName: "PublishSize",
        period: Duration.minutes(5),
        statistic: "Average",
      });
    });

    test("subscription is created under the topic scope by default", () => {
      const topic = new Topic(stack, "Topic");
      topic.addSubscription({
        bind: () => ({
          protocol: SubscriptionProtocol.HTTP,
          endpoint: "http://foo/bar",
          subscriberId: "my-subscription",
        }),
      });
      Template.fromStack(stack).resourceCountIs("aws_sns_subscription", 1);
    });

    test('if "scope" is defined, subscription will be created under that scope', () => {
      const app2 = Testing.app();
      const stackA = new AwsStack(app2, "A");
      const stackB = new AwsStack(app2, "B");
      const topic = new Topic(stackA, "Topic");
      topic.addSubscription({
        bind: () => ({
          protocol: SubscriptionProtocol.HTTP,
          endpoint: "http://foo/bar",
          subscriberScope: stackB,
          subscriberId: "subscriberId",
        }),
      });
      Template.fromStack(stackA).resourceCountIs("aws_sns_subscription", 0);
      Template.fromStack(stackB).resourceCountIs("aws_sns_subscription", 1);
    });

    test("fails if topic policy has no actions", () => {
      const topic = new Topic(stack, "Topic");
      topic.addToResourcePolicy(
        new iam.PolicyStatement({
          resources: ["*"],
          principals: [new iam.ArnPrincipal("arn")],
        })
      );
      expect(() => app.synth()).toThrow(/A PolicyStatement must specify at least one 'action' or 'notAction'/);
    });

    test("fails if topic policy has no IAM principals", () => {
      const topic = new Topic(stack, "Topic");
      topic.addToResourcePolicy(
        new iam.PolicyStatement({
          resources: ["*"],
          actions: ["sns:*"],
        })
      );
      expect(() => app.synth()).toThrow(/must specify at least one IAM principal/);
    });

    test("topic policy should be set if topic is added as a notifications rule target", () => {
      const topic = new Topic(stack, "Topic");
      const rule = new notifications.NotificationRule(stack, "MyNotificationRule", {
        source: {
          bindAsNotificationRuleSource: () => ({
            sourceArn: "ARN",
          }),
        },
        events: ["codebuild-project-build-state-succeeded"],
      });
      rule.addTarget(topic);
      Template.fromStack(stack).hasResourceProperties(topicPolicyTfResource, {
        policy: expect.stringContaining('"Action": "sns:Publish"'),
      });
    });

    test("specify delivery status logging configuration through construct props", () => {
      const feedbackRole = new iam.Role(stack, "feedbackRole", {
        assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
      });
      new Topic(stack, "MyTopic", {
        loggingConfigs: [
          {
            protocol: LoggingProtocol.SQS,
            failureFeedbackRole: feedbackRole,
            successFeedbackRole: feedbackRole,
            successFeedbackSampleRate: 50,
          },
        ],
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        delivery_status_logging: [
          {
            protocol: "sqs",
            failure_feedback_role_arn: { "Fn::GetAtt": [expect.stringContaining("feedbackRole"), "Arn"] },
            success_feedback_role_arn: { "Fn::GetAtt": [expect.stringContaining("feedbackRole"), "Arn"] },
            success_feedback_sample_rate: "50",
          },
        ],
      });
    });

    test("add delivery status logging configuration to a topic", () => {
      const feedbackRole = new iam.Role(stack, "feedbackRole", {
        assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
      });
      const topic = new Topic(stack, "MyTopic");
      topic.addLoggingConfig({
        protocol: LoggingProtocol.HTTP,
        failureFeedbackRole: feedbackRole,
        successFeedbackRole: feedbackRole,
        successFeedbackSampleRate: 50,
      });
      Template.fromStack(stack).hasResourceProperties(topicTfResource, {
        delivery_status_logging: [
          {
            protocol: "http/s",
            failure_feedback_role_arn: { "Fn::GetAtt": [expect.stringContaining("feedbackRole"), "Arn"] },
            success_feedback_role_arn: { "Fn::GetAtt": [expect.stringContaining("feedbackRole"), "Arn"] },
            success_feedback_sample_rate: "50",
          },
        ],
      });
    });

    test("fails if success feedback sample rate is outside the appropriate range", () => {
      const feedbackRole = new iam.Role(stack, "feedbackRole", {
        assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
      });
      new Topic(stack, "MyTopic", {
        loggingConfigs: [
          {
            protocol: LoggingProtocol.SQS,
            failureFeedbackRole: feedbackRole,
            successFeedbackRole: feedbackRole,
            successFeedbackSampleRate: 110,
          },
        ],
      });
      expect(() => app.synth()).toThrow(/Success feedback sample rate must be an integer between 0 and 100/);
    });

    test("fails if success feedback sample rate is decimal", () => {
      const feedbackRole = new iam.Role(stack, "feedbackRole", {
        assumedBy: new iam.ServicePrincipal("sns.amazonaws.com"),
      });
      new Topic(stack, "MyTopic", {
        loggingConfigs: [
          {
            protocol: LoggingProtocol.SQS,
            failureFeedbackRole: feedbackRole,
            successFeedbackRole: feedbackRole,
            successFeedbackSampleRate: 50.4,
          },
        ],
      });
      expect(() => app.synth()).toThrow(/Success feedback sample rate must be an integer between 0 and 100/);
    });

    describe("message retention period", () => {
      test("specify message retention period in days", () => {
        new Topic(stack, "MyTopic", {
          fifo: true,
          messageRetentionPeriodInDays: 10,
        });
        Template.fromStack(stack).hasResourceProperties(topicTfResource, {
          archive_policy: { message_retention_period: 10 },
          fifo_topic: true,
        });
      });

      test.each([0, 366, 12.3, NaN])(
        'throw error if message retention period is invalid value "%s"',
        (days) => {
          expect(() =>
            new Topic(stack, "MyTopic", {
              fifo: true,
              messageRetentionPeriodInDays: days,
            })
          ).toThrow(/`messageRetentionPeriodInDays` must be an integer between 1 and 365/);
        }
      );

      test("throw error when specify messageRetentionPeriodInDays to standard topic", () => {
        expect(() =>
          new Topic(stack, "MyTopic", {
            messageRetentionPeriodInDays: 12,
          })
        ).toThrow(/`messageRetentionPeriodInDays` is only valid for FIFO SNS topics/);
      });
    });

    describe("tracingConfig", () => {
      test("specify tracingConfig", () => {
        new Topic(stack, "MyTopic", {
          tracingConfig: TracingConfig.ACTIVE,
        });
        Template.fromStack(stack).hasResourceProperties(topicTfResource, {
          tracing_config: "Active",
        });
      });
    });
  });
});
```
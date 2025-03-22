# Conversion Response

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:                   30,921
Simulated User Prompt Tokens:         13,107
Simulated Assistent Response Tokens:   9,244
New User Prompt Tokens:               12,439
Total Tokens:                         90,711
Model Max Tokens:                    100,000

```

### Response Statistics
```
Response Time: 50.38s
Actual Usage:
{
  "input_tokens": 65788,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 6170,
  "output_tokens_details": {
    "reasoning_tokens": 3968
  },
  "total_tokens": 71958
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67de28270d4c81908ad2e91ce3d35bad0855143388e9a5dc)

## Response

```typescript
import { SnsTopic as AwsSnsTopic } from "@cdktf/provider-aws";
import { Lazy, Token } from "cdktf";
import { Construct } from "constructs";
import { ArnFormat, AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { AwsStack } from "../aws-stack";
import { IRole } from "../iam";
import { IKey } from "../encryption";
import { ITopic, TopicBase } from "./topic-base";

/**
 * Properties for a new SNS topic
 */
export interface TopicProps extends AwsConstructProps {
  /**
   * A developer-defined string that can be used to identify this SNS topic.
   *
   * The display name must be maximum 100 characters long.
   *
   * @default none
   */
  readonly displayName?: string;

  /**
   * A name for the topic.
   *
   * If not specified a unique name is automatically generated.
   *
   * @default generated name
   */
  readonly topicName?: string;

  /**
   * A KMS Key, either managed by this application, or imported.
   *
   * @default none
   */
  readonly masterKey?: IKey;

  /**
   * Enables content-based deduplication for FIFO topics.
   *
   * @default false
   */
  readonly contentBasedDeduplication?: boolean;

  /**
   * Set true to create a FIFO topic.
   *
   * @default false
   */
  readonly fifo?: boolean;

  /**
   * The list of delivery status logging configurations for the topic.
   *
   * @default none
   */
  readonly loggingConfigs?: LoggingConfig[];

  /**
   * The number of days Amazon SNS retains messages.
   *
   * This property is only valid for FIFO topics.
   *
   * @default undefined (do not archive messages)
   */
  readonly messageRetentionPeriodInDays?: number;

  /**
   * Adds a statement to enforce encryption of data in transit when publishing to the topic.
   *
   * @default false
   */
  readonly enforceSSL?: boolean;

  /**
   * The signature version used when signing notifications.
   *
   * Valid values are "1" or "2".
   *
   * @default "1"
   */
  readonly signatureVersion?: string;

  /**
   * Tracing mode of an Amazon SNS topic.
   *
   * @default TracingConfig.PASS_THROUGH
   */
  readonly tracingConfig?: TracingConfig;
}

/**
 * A logging configuration for delivery status of messages sent from SNS topic.
 */
export interface LoggingConfig {
  /**
   * Indicates one of the supported protocols for the SNS topic.
   */
  readonly protocol: LoggingProtocol;

  /**
   * The IAM role to be used when logging failed message deliveries in CloudWatch.
   *
   * @default none
   */
  readonly failureFeedbackRole?: IRole;

  /**
   * The IAM role to be used when logging successful message deliveries in CloudWatch.
   *
   * @default none
   */
  readonly successFeedbackRole?: IRole;

  /**
   * The percentage of successful message deliveries to sample (an integer from 0 to 100).
   *
   * @default none
   */
  readonly successFeedbackSampleRate?: number;
}

/**
 * The type of supported protocol for SNS delivery status logging.
 */
export enum LoggingProtocol {
  HTTP = "http/s",
  SQS = "sqs",
  LAMBDA = "lambda",
  FIREHOSE = "firehose",
  APPLICATION = "application",
}

/**
 * The tracing mode of an Amazon SNS topic.
 */
export enum TracingConfig {
  PASS_THROUGH = "PassThrough",
  ACTIVE = "Active",
}

/**
 * Properties necessary to import an existing SNS topic.
 */
export interface TopicAttributes {
  /**
   * The ARN of the SNS topic.
   */
  readonly topicArn: string;

  /**
   * Whether content-based deduplication is enabled.
   * Only applicable for FIFO topics.
   *
   * @default false
   */
  readonly contentBasedDeduplication?: boolean;
}

/**
 * Represents an SNS topic.
 */
export class Topic extends TopicBase {
  /**
   * Import an existing SNS topic provided an ARN.
   *
   * @param scope The parent construct.
   * @param id The construct's id.
   * @param topicArn The ARN of the topic (e.g. arn:aws:sns:us-east-2:123456789012:MyTopic)
   */
  public static fromTopicArn(scope: Construct, id: string, topicArn: string): ITopic {
    return Topic.fromTopicAttributes(scope, id, { topicArn });
  }

  /**
   * Import an existing SNS topic provided topic attributes.
   *
   * @param scope The parent construct.
   * @param id The construct's id.
   * @param attrs The topic attributes to import.
   */
  public static fromTopicAttributes(scope: Construct, id: string, attrs: TopicAttributes): ITopic {
    const topicName = AwsStack.ofAwsConstruct(scope).splitArn(attrs.topicArn, ArnFormat.NO_RESOURCE_NAME).resource;
    const fifo = topicName.endsWith(".fifo");

    if (attrs.contentBasedDeduplication && !fifo) {
      throw new Error("Cannot import topic; contentBasedDeduplication is only available for FIFO SNS topics.");
    }

    class Import extends TopicBase {
      public readonly topicArn = attrs.topicArn;
      public readonly topicName = topicName;
      public readonly fifo = fifo;
      public readonly contentBasedDeduplication = attrs.contentBasedDeduplication ?? false;
      protected autoCreatePolicy: boolean = false;
    }

    return new Import(scope, id, {
      environmentFromArn: attrs.topicArn,
    });
  }

  public readonly topicArn: string;
  public readonly topicName: string;
  public readonly contentBasedDeduplication: boolean;
  public readonly fifo: boolean;
  public readonly enforceSSL?: boolean;

  protected readonly autoCreatePolicy: boolean = true;

  private readonly loggingConfigs: LoggingConfig[] = [];

  constructor(scope: Construct, id: string, props: TopicProps = {}) {
    super(scope, id, {
      physicalName: props.topicName,
    });

    this.enforceSSL = props.enforceSSL;

    if (props.contentBasedDeduplication && !props.fifo) {
      throw new Error("Content based deduplication can only be enabled for FIFO SNS topics.");
    }
    if (props.messageRetentionPeriodInDays && !props.fifo) {
      throw new Error("`messageRetentionPeriodInDays` is only valid for FIFO SNS topics.");
    }
    if (
      props.messageRetentionPeriodInDays !== undefined &&
      !Token.isUnresolved(props.messageRetentionPeriodInDays) &&
      (!Number.isInteger(props.messageRetentionPeriodInDays) ||
        props.messageRetentionPeriodInDays < 1 ||
        props.messageRetentionPeriodInDays > 365)
    ) {
      throw new Error("`messageRetentionPeriodInDays` must be an integer between 1 and 365");
    }
    if (props.loggingConfigs) {
      props.loggingConfigs.forEach(c => this.addLoggingConfig(c));
    }

    let cfnTopicName: string;
    if (props.fifo && props.topicName && !props.topicName.endsWith(".fifo")) {
      cfnTopicName = this.physicalName + ".fifo";
    } else if (props.fifo && !props.topicName) {
      // CloudFormation requires topic names <= 256 characters; reserve room for ".fifo"
      const prefixName = Names.uniqueResourceName(this, { maxLength: 251, separator: "-" });
      cfnTopicName = `${prefixName}.fifo`;
    } else {
      cfnTopicName = this.physicalName;
    }

    if (
      props.signatureVersion &&
      !Token.isUnresolved(props.signatureVersion) &&
      props.signatureVersion !== "1" &&
      props.signatureVersion !== "2"
    ) {
      throw new Error(`signatureVersion must be "1" or "2", received: "${props.signatureVersion}"`);
    }

    if (props.displayName && !Token.isUnresolved(props.displayName) && props.displayName.length > 100) {
      throw new Error(`displayName must be less than or equal to 100 characters, got ${props.displayName.length}`);
    }

    const resource = new AwsSnsTopic(this, "Resource", {
      archivePolicy: props.messageRetentionPeriodInDays
        ? JSON.stringify({ MessageRetentionPeriod: props.messageRetentionPeriodInDays })
        : undefined,
      displayName: props.displayName,
      topicName: cfnTopicName,
      kmsMasterKeyId: props.masterKey ? props.masterKey.keyArn : undefined,
      contentBasedDeduplication: props.contentBasedDeduplication,
      fifoTopic: props.fifo,
      signatureVersion: props.signatureVersion,
      deliveryStatusLogging: Lazy.any({ produce: () => this.renderLoggingConfigs() }, { omitEmptyArray: true }),
      tracingConfig: props.tracingConfig,
    });

    this.topicArn = this.getResourceArnAttribute(resource.ref, {
      service: "sns",
      resource: this.physicalName,
    });
    this.topicName = this.getResourceNameAttribute(resource.attrTopicName);
    this.fifo = props.fifo || false;
    this.contentBasedDeduplication = props.contentBasedDeduplication || false;
  }

  /**
   * Adds a delivery status logging configuration to the topic.
   */
  public addLoggingConfig(config: LoggingConfig) {
    this.loggingConfigs.push(config);
  }

  /**
   * Returns the delivery status logging configurations in the format expected by the provider.
   */
  private renderLoggingConfigs(): AwsSnsTopic["deliveryStatusLogging"] {
    return this.loggingConfigs.map(renderLoggingConfig);

    function renderLoggingConfig(spec: LoggingConfig): any {
      if (spec.successFeedbackSampleRate !== undefined) {
        const rate = spec.successFeedbackSampleRate;
        if (!Number.isInteger(rate) || rate < 0 || rate > 100) {
          throw new Error("Success feedback sample rate must be an integer between 0 and 100");
        }
      }
      return {
        protocol: spec.protocol,
        failureFeedbackRoleArn: spec.failureFeedbackRole?.roleArn,
        successFeedbackRoleArn: spec.successFeedbackRole?.roleArn,
        successFeedbackSampleRate: spec.successFeedbackSampleRate !== undefined
          ? spec.successFeedbackSampleRate.toString()
          : undefined,
      };
    }
  }
}
```
# Conversion Response

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:                   30,921
Simulated User Prompt Tokens:         13,107
Simulated Assistent Response Tokens:   9,244
New User Prompt Tokens:               13,441
Total Tokens:                         91,713
Model Max Tokens:                    100,000

```

### Response Statistics
```
Response Time: 122.73s
Actual Usage:
{
  "input_tokens": 66790,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 13984,
  "output_tokens_details": {
    "reasoning_tokens": 10112
  },
  "total_tokens": 80774
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67de85fccbe08190b5b706b872deecaa0d02c25b5ec489e5)

## Response

```typescript
/**********************************************************************
 * sns-topic.ts
 *
 * This file defines TerraConstruct equivalents for SNS Topic constructs,
 * including the abstract base (TopicBase), a concrete Topic implementation,
 * and minimal stubs for related resources such as topic policy and subscriptions.
 *
 * Note: This conversion assumes that the TerraConstructs libraries provide
 * similar base classes and helper functions (such as AwsConstructBase, AwsStack,
 * and core types) as described in the reference documents.
 **********************************************************************/

import { Construct, IDependable } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { IResource, Token } from "../../core";
import * as iam from "../aws-iam";
import * as notifications from "../aws-codestarnotifications";
import { snsTopic } from "@cdktf/provider-aws";
import * as cdktf from "cdktf";
import { AwsStack } from "../aws-stack";

//---------------------------------------------------------------------
// ITopic interface and TopicBase abstract class
//---------------------------------------------------------------------

export interface ITopic extends IResource, notifications.INotificationRuleTarget {
  /**
   * The ARN of the topic.
   *
   * @attribute
   */
  readonly topicArn: string;

  /**
   * The name of the topic.
   *
   * @attribute
   */
  readonly topicName: string;

  /**
   * Indicates whether content‐based deduplication is enabled.
   */
  readonly contentBasedDeduplication: boolean;

  /**
   * Whether this topic is a FIFO topic.
   */
  readonly fifo: boolean;

  /**
   * Subscribe an endpoint to the topic.
   */
  addSubscription(subscription: ITopicSubscription): Subscription;

  /**
   * Adds a statement to the IAM resource policy associated with the topic.
   */
  addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult;

  /**
   * Grant publish permissions to the given identity.
   */
  grantPublish(identity: iam.IGrantable): iam.Grant;

  /**
   * Grant subscribe permissions to the given identity.
   */
  grantSubscribe(identity: iam.IGrantable): iam.Grant;

  /**
   * Binds the topic as a notification target.
   */
  bindAsNotificationRuleTarget(scope: Construct): notifications.NotificationRuleTargetConfig;
}

export abstract class TopicBase extends AwsConstructBase implements ITopic {
  public abstract readonly topicArn: string;
  public abstract readonly topicName: string;
  public abstract readonly fifo: boolean;
  public abstract readonly contentBasedDeduplication: boolean;
  // When true, TopicBase will automatically create a topic policy resource when needed.
  protected abstract readonly autoCreatePolicy: boolean;
  // Optional flag enforcing SSL in publishing.
  protected enforceSSL?: boolean;

  // Holds the automatically created topic policy.
  private policy?: TopicPolicy;

  constructor(scope: Construct, id: string, props?: AwsConstructProps) {
    super(scope, id, props);
    // Validate that any attached policy is correctly formed.
    this.node.addValidation({
      validate: () => this.policy?.document.validateForResourcePolicy() ?? []
    });
  }

  /**
   * Subscribes an endpoint to this topic.
   * The subscription configuration is obtained via the subscriber’s bind() method.
   */
  public addSubscription(subscription: ITopicSubscription): Subscription {
    const subscriptionConfig = subscription.bind(this);
    const scope = subscriptionConfig.subscriberScope || this;
    let id = subscriptionConfig.subscriberId;
    if (Token.isUnresolved(subscriptionConfig.subscriberId)) {
      id = this.nextTokenId(scope);
    }
    if (scope.node.tryFindChild(id)) {
      throw new Error(`A subscription with id "${id}" already exists under the scope ${scope.node.path}`);
    }
    const sub = new Subscription(scope, id, {
      topic: this,
      ...subscriptionConfig,
    });
    if (subscriptionConfig.subscriptionDependency) {
      sub.node.addDependency(subscriptionConfig.subscriptionDependency);
    }
    return sub;
  }

  /**
   * Adds an IAM policy statement to this topic’s resource policy.
   */
  public addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    if (!this.policy && this.autoCreatePolicy) {
      this.policy = new TopicPolicy(this, "Policy", { topics: [this] });
    }
    if (this.policy) {
      this.policy.document.addStatements(statement);
      if (this.enforceSSL) {
        this.policy.document.addStatements(this.createSSLPolicyDocument());
      }
      return { statementAdded: true, policyDependable: this.policy };
    }
    return { statementAdded: false };
  }

  /**
   * Returns a policy statement that denies non-SSL publish requests.
   */
  protected createSSLPolicyDocument(): iam.PolicyStatement {
    return new iam.PolicyStatement({
      sid: "AllowPublishThroughSSLOnly",
      actions: ["sns:Publish"],
      effect: iam.Effect.DENY,
      resources: [this.topicArn],
      conditions: { Bool: { "aws:SecureTransport": "false" } },
      principals: [new iam.StarPrincipal()],
    });
  }

  /**
   * Grants publish permissions to the given IAM identity.
   */
  public grantPublish(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipalOrResource({
      grantee,
      actions: ["sns:Publish"],
      resourceArns: [this.topicArn],
      resource: this,
    });
  }

  /**
   * Grants subscribe permissions to the given IAM identity.
   */
  public grantSubscribe(grantee: iam.IGrantable): iam.Grant {
    return iam.Grant.addToPrincipalOrResource({
      grantee,
      actions: ["sns:Subscribe"],
      resourceArns: [this.topicArn],
      resource: this,
    });
  }

  /**
   * Binds this topic as a notification target.
   * For SNS topics, this ensures that codestar-notifications can publish to the topic.
   */
  public bindAsNotificationRuleTarget(_scope: Construct): notifications.NotificationRuleTargetConfig {
    this.grantPublish(new iam.ServicePrincipal("codestar-notifications.amazonaws.com"));
    return {
      targetType: "SNS",
      targetAddress: this.topicArn,
    };
  }

  private nextTokenId(scope: Construct): string {
    let nextSuffix = 1;
    const re = /TokenSubscription:([\d]*)/gm;
    for (const child of scope.node.findAll()) {
      const m = re.exec(child.node.id);
      if (m !== null) {
        const matchSuffix = parseInt(m[1], 10);
        if (matchSuffix >= nextSuffix) {
          nextSuffix = matchSuffix + 1;
        }
      }
    }
    return `TokenSubscription:${nextSuffix}`;
  }
}

//---------------------------------------------------------------------
// TopicPolicy conversion (from policy.ts)
//---------------------------------------------------------------------

export interface TopicPolicyProps {
  /**
   * The set of topics this policy applies to.
   */
  readonly topics: ITopic[];
  /**
   * An optional IAM policy document.
   */
  readonly policyDocument?: iam.PolicyDocument;
  /**
   * If true, enforces SSL by adding an additional statement.
   */
  readonly enforceSSL?: boolean;
}

/**
 * Represents the resource policy for SNS topics.
 */
export class TopicPolicy extends cdktf.TerraformResource {
  public readonly document: iam.PolicyDocument;
  private readonly props: TopicPolicyProps;

  constructor(scope: Construct, id: string, props: TopicPolicyProps) {
    super(scope, id, props);
    this.props = props;
    this.document = props.policyDocument || new iam.PolicyDocument(this, "Document");
    if (props.enforceSSL) {
      this.document.addStatements(this.createSSLPolicyDocument());
    }
  }

  protected createSSLPolicyDocument(): iam.PolicyStatement {
    const topicArns = this.props.topics.map((t) => t.topicArn);
    return new iam.PolicyStatement({
      sid: "AllowPublishThroughSSLOnly",
      actions: ["sns:Publish"],
      effect: iam.Effect.DENY,
      resources: topicArns,
      conditions: { Bool: { "aws:SecureTransport": "false" } },
      principals: [new iam.StarPrincipal()],
    });
  }
}

//---------------------------------------------------------------------
// ITopicSubscription interface (from subscriber.ts)
//---------------------------------------------------------------------

export interface TopicSubscriptionConfig extends SubscriptionOptions {
  /**
   * The scope in which the SNS subscription resource will be defined.
   * If not provided, the topic itself is used.
   */
  readonly subscriberScope?: Construct;
  /**
   * The subscriber’s id; used as the construct id.
   */
  readonly subscriberId: string;
  /**
   * Resources that must be created before the subscription.
   */
  readonly subscriptionDependency?: IDependable;
}

export interface ITopicSubscription {
  /**
   * Returns a configuration used for subscribing to the topic.
   */
  bind(topic: ITopic): TopicSubscriptionConfig;
}

//---------------------------------------------------------------------
// Subscription conversion (from subscription.ts)
//---------------------------------------------------------------------

export interface SubscriptionOptions {
  /**
   * The subscription protocol.
   */
  readonly protocol: string;
  /**
   * The subscription endpoint.
   */
  readonly endpoint: string;
  /**
   * Whether raw message delivery is enabled.
   */
  readonly rawMessageDelivery?: boolean | cdktf.IResolvable;
  /**
   * An optional JSON string for message filter policy.
   */
  readonly filterPolicy?: string;
  /**
   * An optional JSON string for message filter policy on the message body.
   */
  readonly filterPolicyWithMessageBody?: string;
  /**
   * The region of the topic for cross-region subscriptions.
   */
  readonly region?: string;
  /**
   * Dead-letter queue for the subscription.
   */
  readonly deadLetterQueue?: any; // Replace with proper IQueue if available.
  /**
   * ARN of role for firehose subscriptions.
   */
  readonly subscriptionRoleArn?: string;
  /**
   * An optional delivery policy as JSON.
   */
  readonly deliveryPolicy?: string;
}

export interface SubscriptionProps extends SubscriptionOptions {
  /**
   * The topic to subscribe to.
   */
  readonly topic: ITopic;
}

/**
 * A subscription for an SNS topic.
 */
export class Subscription extends cdktf.TerraformResource {
  // Optionally expose the dead letter queue if needed.
  readonly deadLetterQueue?: any;

  constructor(scope: Construct, id: string, props: SubscriptionProps) {
    super(scope, id, props);
    // Create an SNS topic subscription resource using the CDKTF provider.
    new snsTopic.SnsTopicSubscription(this, "Resource", {
      topicArn: props.topic.topicArn,
      protocol: props.protocol,
      endpoint: props.endpoint,
      rawMessageDelivery: props.rawMessageDelivery,
      deliveryPolicy: props.deliveryPolicy,
      filterPolicy: props.filterPolicy,
      filterPolicyScope: props.filterPolicyWithMessageBody, // if applicable
      // Additional properties such as confirmationTimeoutInMinutes,
      // redrivePolicy, replayPolicy, and subscriptionRoleArn can be added as needed.
    });
  }
}

//---------------------------------------------------------------------
// Concrete Topic implementation (from topic.d.ts)
//---------------------------------------------------------------------

export interface TopicProps extends AwsConstructProps {
  /**
   * A display name for the topic.
   */
  readonly displayName?: string;
  /**
   * The topic name.
   * If omitted, a unique physical name is generated.
   */
  readonly topicName?: string;
  /**
   * A KMS key for server‐side encryption.
   */
  readonly masterKey?: iam.IKey;
  /**
   * Enables content‐based deduplication.
   */
  readonly contentBasedDeduplication?: boolean;
  /**
   * Set to true to create a FIFO topic.
   */
  readonly fifo?: boolean;
  /**
   * Delivery status logging configurations.
   */
  readonly loggingConfigs?: any[];
  /**
   * Message retention period (in days) for FIFO topics.
   */
  readonly messageRetentionPeriodInDays?: number;
  /**
   * Enforce SSL for publishing messages.
   */
  readonly enforceSSL?: boolean;
  /**
   * The signature version for message signing.
   */
  readonly signatureVersion?: string;
  /**
   * The tracing configuration.
   */
  readonly tracingConfig?: string;
  /**
   * The FIFO throughput scope.
   */
  readonly fifoThroughputScope?: string;
}

/**
 * A new SNS topic.
 */
export class Topic extends TopicBase implements ITopic {
  public readonly topicArn: string;
  public readonly topicName: string;
  public readonly masterKey?: iam.IKey;
  public readonly contentBasedDeduplication: boolean;
  public readonly fifo: boolean;
  protected readonly autoCreatePolicy = true;

  private resource: snsTopic.SnsTopic;

  constructor(scope: Construct, id: string, props?: TopicProps) {
    super(scope, id, props);
    const name =
      props?.topicName ||
      this.stack.uniqueResourceName(this, { prefix: this.gridUUID });
    this.resource = new snsTopic.SnsTopic(this, "Resource", {
      name,
      displayName: props?.displayName,
      fifoTopic: props?.fifo,
      contentBasedDeduplication: props?.contentBasedDeduplication,
      // Use the keyArn from masterKey if provided.
      kmsMasterKeyId: props?.masterKey ? props.masterKey.keyArn : undefined,
      tracingConfig: props?.tracingConfig,
      // Additional properties (like tags) can be added here.
    });
    this.topicArn = this.getResourceArnAttribute(this.resource.arn, {
      service: "sns",
      resource: "topic",
      resourceName: name,
    });
    this.topicName = this.getResourceNameAttribute(this.resource.name);
    this.masterKey = props?.masterKey;
    this.contentBasedDeduplication = props?.contentBasedDeduplication ?? false;
    this.fifo = props?.fifo ?? false;
    this.enforceSSL = props?.enforceSSL ?? false;
  }

  /**
   * Imports an existing topic by its ARN.
   */
  public static fromTopicArn(scope: Construct, id: string, topicArn: string): ITopic {
    const parts = AwsStack.ofAwsConstruct(scope).splitArn(topicArn, "sns");
    return new ImportedTopic(scope, id, {
      topicArn,
      topicName: parts.resourceName || "",
      contentBasedDeduplication: false,
      fifo: false,
    });
  }

  /**
   * Imports an existing topic from its attributes.
   */
  public static fromTopicAttributes(scope: Construct, id: string, attrs: TopicAttributes): ITopic {
    return new ImportedTopic(scope, id, {
      topicArn: attrs.topicArn,
      topicName: attrs.topicArn.split(":").pop() || "",
      contentBasedDeduplication: attrs.contentBasedDeduplication ?? false,
      fifo: false,
      masterKey: attrs.keyArn ? { keyArn: attrs.keyArn } as any : undefined,
    });
  }
}

export interface TopicAttributes {
  /**
   * The ARN of the SNS topic.
   */
  readonly topicArn: string;
  /**
   * The ARN of the master key if the topic is encrypted.
   */
  readonly keyArn?: string;
  /**
   * Whether content‐based deduplication is enabled.
   */
  readonly contentBasedDeduplication?: boolean;
}

// Internal class for imported topics.
class ImportedTopic extends TopicBase {
  public readonly topicArn: string;
  public readonly topicName: string;
  public readonly masterKey?: iam.IKey;
  public readonly contentBasedDeduplication: boolean;
  public readonly fifo: boolean = false; // Imported topics assume standard behavior.
  protected readonly autoCreatePolicy = false;

  constructor(scope: Construct, id: string, attrs: {
    topicArn: string;
    topicName: string;
    contentBasedDeduplication: boolean;
    fifo: boolean;
    masterKey?: iam.IKey;
  }) {
    super(scope, id, { environmentFromArn: attrs.topicArn });
    this.topicArn = attrs.topicArn;
    this.topicName = attrs.topicName;
    this.contentBasedDeduplication = attrs.contentBasedDeduplication;
    this.masterKey = attrs.masterKey;
  }
}

//---------------------------------------------------------------------
// Minimal stubs for additional SNS Topic related constructs
//---------------------------------------------------------------------

// SnsTopicDataProtectionPolicy
export interface SnsTopicDataProtectionPolicyConfig extends cdktf.TerraformMetaArguments {
  readonly arn: string;
  readonly policy: string;
}

export class SnsTopicDataProtectionPolicy extends cdktf.TerraformResource {
  static readonly tfResourceType = "aws_sns_topic_data_protection_policy";
  constructor(scope: Construct, id: string, config: SnsTopicDataProtectionPolicyConfig) {
    super(scope, id, config);
  }
  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      arn: this.interpolationForAttribute("arn"),
      policy: this.interpolationForAttribute("policy"),
    };
  }
  protected synthesizeHclAttributes(): { [name: string]: any } {
    return this.synthesizeAttributes();
  }
}

// SnsTopicSubscription
export interface SnsTopicSubscriptionConfig extends cdktf.TerraformMetaArguments {
  readonly endpoint: string;
  readonly protocol: string;
  readonly topicArn: string;
  readonly confirmationTimeoutInMinutes?: number;
  readonly deliveryPolicy?: string;
  readonly endpointAutoConfirms?: boolean | cdktf.IResolvable;
  readonly filterPolicy?: string;
  readonly filterPolicyScope?: string;
  readonly rawMessageDelivery?: boolean | cdktf.IResolvable;
  readonly redrivePolicy?: string;
  readonly replayPolicy?: string;
  readonly subscriptionRoleArn?: string;
}

export class SnsTopicSubscription extends cdktf.TerraformResource {
  static readonly tfResourceType = "aws_sns_topic_subscription";
  constructor(scope: Construct, id: string, config: SnsTopicSubscriptionConfig) {
    super(scope, id, config);
  }
  protected synthesizeAttributes(): { [name: string]: any } {
    return {
      endpoint: this.interpolationForAttribute("endpoint"),
      protocol: this.interpolationForAttribute("protocol"),
      topicArn: this.interpolationForAttribute("topic_arn"),
      deliveryPolicy: this.interpolationForAttribute("delivery_policy"),
      rawMessageDelivery: this.interpolationForAttribute("raw_message_delivery"),
      // Additional attributes can be added as needed.
    };
  }
  protected synthesizeHclAttributes(): { [name: string]: any } {
    return this.synthesizeAttributes();
  }
}
```
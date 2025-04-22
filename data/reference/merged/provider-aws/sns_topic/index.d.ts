/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */
import { Construct } from 'constructs';
import * as cdktf from 'cdktf';
export interface SnsTopicConfig extends cdktf.TerraformMetaArguments {
    /** (Optional) IAM role for failure feedback */
    readonly applicationFailureFeedbackRoleArn?: string;
    /** (Optional) The IAM role permitted to receive success feedback for this topic */
    readonly applicationSuccessFeedbackRoleArn?: string;
    /** (Optional) Percentage of success to sample */
    readonly applicationSuccessFeedbackSampleRate?: number;
    /** (Optional) The message archive policy for FIFO topics. More details in the [AWS documentation](https://docs.aws.amazon.com/sns/latest/dg/message-archiving-and-replay-topic-owner.html). */
    readonly archivePolicy?: string;
    /** (Optional) Enables content-based deduplication for FIFO topics. For more information, see the [related documentation](https://docs.aws.amazon.com/sns/latest/dg/fifo-message-dedup.html) */
    readonly contentBasedDeduplication?: boolean | cdktf.IResolvable;
    /** (Optional) The SNS delivery policy. More details in the [AWS documentation](https://docs.aws.amazon.com/sns/latest/dg/DeliveryPolicies.html). */
    readonly deliveryPolicy?: string;
    /** (Optional) The display name for the topic */
    readonly displayName?: string;
    /** (Optional) Boolean indicating whether or not to create a FIFO (first-in-first-out) topic. FIFO topics can't deliver messages to customer managed endpoints, such as email addresses, mobile apps, SMS, or HTTP(S) endpoints. These endpoint types aren't guaranteed to preserve strict message ordering. Default is `false`. */
    readonly fifoTopic?: boolean | cdktf.IResolvable;
    /** (Optional) IAM role for failure feedback */
    readonly firehoseFailureFeedbackRoleArn?: string;
    /** (Optional) The IAM role permitted to receive success feedback for this topic */
    readonly firehoseSuccessFeedbackRoleArn?: string;
    /** (Optional) Percentage of success to sample */
    readonly firehoseSuccessFeedbackSampleRate?: number;
    /** (Optional) IAM role for failure feedback */
    readonly httpFailureFeedbackRoleArn?: string;
    /** (Optional) The IAM role permitted to receive success feedback for this topic */
    readonly httpSuccessFeedbackRoleArn?: string;
    /** (Optional) Percentage of success to sample */
    readonly httpSuccessFeedbackSampleRate?: number;
    /**
    * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.93.0/docs/resources/sns_topic#id SnsTopic#id}
    *
    * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
    * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
    */
    readonly id?: string;
    /** (Optional) The ID of an AWS-managed customer master key (CMK) for Amazon SNS or a custom CMK. For more information, see [Key Terms](https://docs.aws.amazon.com/sns/latest/dg/sns-server-side-encryption.html#sse-key-terms) */
    readonly kmsMasterKeyId?: string;
    /** (Optional) IAM role for failure feedback */
    readonly lambdaFailureFeedbackRoleArn?: string;
    /** (Optional) The IAM role permitted to receive success feedback for this topic */
    readonly lambdaSuccessFeedbackRoleArn?: string;
    /** (Optional) Percentage of success to sample */
    readonly lambdaSuccessFeedbackSampleRate?: number;
    /** (Optional) The name of the topic. Topic names must be made up of only uppercase and lowercase ASCII letters, numbers, underscores, and hyphens, and must be between 1 and 256 characters long. For a FIFO (first-in-first-out) topic, the name must end with the `.fifo` suffix. If omitted, Terraform will assign a random, unique name. Conflicts with `namePrefix` */
    readonly name?: string;
    /** (Optional) Creates a unique name beginning with the specified prefix. Conflicts with `name` */
    readonly namePrefix?: string;
    /** (Optional) The fully-formed AWS policy as JSON. For more information about building AWS IAM policy documents with Terraform, see the [AWS IAM Policy Document Guide](https://learn.hashicorp.com/terraform/aws/iam-policy). */
    readonly policy?: string;
    /** (Optional) If `SignatureVersion` should be [1 (SHA1) or 2 (SHA256)](https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html). The signature version corresponds to the hashing algorithm used while creating the signature of the notifications, subscription confirmations, or unsubscribe confirmation messages sent by Amazon SNS. */
    readonly signatureVersion?: number;
    /** (Optional) IAM role for failure feedback */
    readonly sqsFailureFeedbackRoleArn?: string;
    /** (Optional) The IAM role permitted to receive success feedback for this topic */
    readonly sqsSuccessFeedbackRoleArn?: string;
    /** (Optional) Percentage of success to sample */
    readonly sqsSuccessFeedbackSampleRate?: number;
    /** (Optional) Key-value map of resource tags. If configured with a provider [`defaultTags` configuration block](https://registry.terraform.io/providers/hashicorp/aws/latest/docs#default_tags-configuration-block) present, tags with matching keys will overwrite those defined at the provider-level. */
    readonly tags?: {
        [key: string]: string;
    };
    /**
    * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.93.0/docs/resources/sns_topic#tags_all SnsTopic#tags_all}
    */
    readonly tagsAll?: {
        [key: string]: string;
    };
    /** (Optional) Tracing mode of an Amazon SNS topic. Valid values: `"PassThrough"`, `"Active"`. */
    readonly tracingConfig?: string;
}
/**
* Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.93.0/docs/resources/sns_topic aws_sns_topic}
*/
export declare class SnsTopic extends cdktf.TerraformResource {
    static readonly tfResourceType = "aws_sns_topic";
    /**
    * Generates CDKTF code for importing a SnsTopic resource upon running "cdktf plan <stack-name>"
    * @param scope The scope in which to define this construct
    * @param importToId The construct id used in the generated config for the SnsTopic to import
    * @param importFromId The id of the existing SnsTopic that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.93.0/docs/resources/sns_topic#import import section} in the documentation of this resource for the id to use
    * @param provider? Optional instance of the provider where the SnsTopic to import is found
    */
    static generateConfigForImport(scope: Construct, importToId: string, importFromId: string, provider?: cdktf.TerraformProvider): cdktf.ImportableResource;
    /**
    * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.93.0/docs/resources/sns_topic aws_sns_topic} Resource
    *
    * @param scope The scope in which to define this construct
    * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
    * @param options SnsTopicConfig = {}
    */
    constructor(scope: Construct, id: string, config?: SnsTopicConfig);
    private _applicationFailureFeedbackRoleArn?;
    get applicationFailureFeedbackRoleArn(): string;
    set applicationFailureFeedbackRoleArn(value: string);
    resetApplicationFailureFeedbackRoleArn(): void;
    get applicationFailureFeedbackRoleArnInput(): string | undefined;
    private _applicationSuccessFeedbackRoleArn?;
    get applicationSuccessFeedbackRoleArn(): string;
    set applicationSuccessFeedbackRoleArn(value: string);
    resetApplicationSuccessFeedbackRoleArn(): void;
    get applicationSuccessFeedbackRoleArnInput(): string | undefined;
    private _applicationSuccessFeedbackSampleRate?;
    get applicationSuccessFeedbackSampleRate(): number;
    set applicationSuccessFeedbackSampleRate(value: number);
    resetApplicationSuccessFeedbackSampleRate(): void;
    get applicationSuccessFeedbackSampleRateInput(): number | undefined;
    private _archivePolicy?;
    get archivePolicy(): string;
    set archivePolicy(value: string);
    resetArchivePolicy(): void;
    get archivePolicyInput(): string | undefined;
    get arn(): string;
    get beginningArchiveTime(): string;
    private _contentBasedDeduplication?;
    get contentBasedDeduplication(): boolean | cdktf.IResolvable;
    set contentBasedDeduplication(value: boolean | cdktf.IResolvable);
    resetContentBasedDeduplication(): void;
    get contentBasedDeduplicationInput(): boolean | cdktf.IResolvable | undefined;
    private _deliveryPolicy?;
    get deliveryPolicy(): string;
    set deliveryPolicy(value: string);
    resetDeliveryPolicy(): void;
    get deliveryPolicyInput(): string | undefined;
    private _displayName?;
    get displayName(): string;
    set displayName(value: string);
    resetDisplayName(): void;
    get displayNameInput(): string | undefined;
    private _fifoTopic?;
    get fifoTopic(): boolean | cdktf.IResolvable;
    set fifoTopic(value: boolean | cdktf.IResolvable);
    resetFifoTopic(): void;
    get fifoTopicInput(): boolean | cdktf.IResolvable | undefined;
    private _firehoseFailureFeedbackRoleArn?;
    get firehoseFailureFeedbackRoleArn(): string;
    set firehoseFailureFeedbackRoleArn(value: string);
    resetFirehoseFailureFeedbackRoleArn(): void;
    get firehoseFailureFeedbackRoleArnInput(): string | undefined;
    private _firehoseSuccessFeedbackRoleArn?;
    get firehoseSuccessFeedbackRoleArn(): string;
    set firehoseSuccessFeedbackRoleArn(value: string);
    resetFirehoseSuccessFeedbackRoleArn(): void;
    get firehoseSuccessFeedbackRoleArnInput(): string | undefined;
    private _firehoseSuccessFeedbackSampleRate?;
    get firehoseSuccessFeedbackSampleRate(): number;
    set firehoseSuccessFeedbackSampleRate(value: number);
    resetFirehoseSuccessFeedbackSampleRate(): void;
    get firehoseSuccessFeedbackSampleRateInput(): number | undefined;
    private _httpFailureFeedbackRoleArn?;
    get httpFailureFeedbackRoleArn(): string;
    set httpFailureFeedbackRoleArn(value: string);
    resetHttpFailureFeedbackRoleArn(): void;
    get httpFailureFeedbackRoleArnInput(): string | undefined;
    private _httpSuccessFeedbackRoleArn?;
    get httpSuccessFeedbackRoleArn(): string;
    set httpSuccessFeedbackRoleArn(value: string);
    resetHttpSuccessFeedbackRoleArn(): void;
    get httpSuccessFeedbackRoleArnInput(): string | undefined;
    private _httpSuccessFeedbackSampleRate?;
    get httpSuccessFeedbackSampleRate(): number;
    set httpSuccessFeedbackSampleRate(value: number);
    resetHttpSuccessFeedbackSampleRate(): void;
    get httpSuccessFeedbackSampleRateInput(): number | undefined;
    private _id?;
    get id(): string;
    set id(value: string);
    resetId(): void;
    get idInput(): string | undefined;
    private _kmsMasterKeyId?;
    get kmsMasterKeyId(): string;
    set kmsMasterKeyId(value: string);
    resetKmsMasterKeyId(): void;
    get kmsMasterKeyIdInput(): string | undefined;
    private _lambdaFailureFeedbackRoleArn?;
    get lambdaFailureFeedbackRoleArn(): string;
    set lambdaFailureFeedbackRoleArn(value: string);
    resetLambdaFailureFeedbackRoleArn(): void;
    get lambdaFailureFeedbackRoleArnInput(): string | undefined;
    private _lambdaSuccessFeedbackRoleArn?;
    get lambdaSuccessFeedbackRoleArn(): string;
    set lambdaSuccessFeedbackRoleArn(value: string);
    resetLambdaSuccessFeedbackRoleArn(): void;
    get lambdaSuccessFeedbackRoleArnInput(): string | undefined;
    private _lambdaSuccessFeedbackSampleRate?;
    get lambdaSuccessFeedbackSampleRate(): number;
    set lambdaSuccessFeedbackSampleRate(value: number);
    resetLambdaSuccessFeedbackSampleRate(): void;
    get lambdaSuccessFeedbackSampleRateInput(): number | undefined;
    private _name?;
    get name(): string;
    set name(value: string);
    resetName(): void;
    get nameInput(): string | undefined;
    private _namePrefix?;
    get namePrefix(): string;
    set namePrefix(value: string);
    resetNamePrefix(): void;
    get namePrefixInput(): string | undefined;
    get owner(): string;
    private _policy?;
    get policy(): string;
    set policy(value: string);
    resetPolicy(): void;
    get policyInput(): string | undefined;
    private _signatureVersion?;
    get signatureVersion(): number;
    set signatureVersion(value: number);
    resetSignatureVersion(): void;
    get signatureVersionInput(): number | undefined;
    private _sqsFailureFeedbackRoleArn?;
    get sqsFailureFeedbackRoleArn(): string;
    set sqsFailureFeedbackRoleArn(value: string);
    resetSqsFailureFeedbackRoleArn(): void;
    get sqsFailureFeedbackRoleArnInput(): string | undefined;
    private _sqsSuccessFeedbackRoleArn?;
    get sqsSuccessFeedbackRoleArn(): string;
    set sqsSuccessFeedbackRoleArn(value: string);
    resetSqsSuccessFeedbackRoleArn(): void;
    get sqsSuccessFeedbackRoleArnInput(): string | undefined;
    private _sqsSuccessFeedbackSampleRate?;
    get sqsSuccessFeedbackSampleRate(): number;
    set sqsSuccessFeedbackSampleRate(value: number);
    resetSqsSuccessFeedbackSampleRate(): void;
    get sqsSuccessFeedbackSampleRateInput(): number | undefined;
    private _tags?;
    get tags(): {
        [key: string]: string;
    };
    set tags(value: {
        [key: string]: string;
    });
    resetTags(): void;
    get tagsInput(): {
        [key: string]: string;
    } | undefined;
    private _tagsAll?;
    get tagsAll(): {
        [key: string]: string;
    };
    set tagsAll(value: {
        [key: string]: string;
    });
    resetTagsAll(): void;
    get tagsAllInput(): {
        [key: string]: string;
    } | undefined;
    private _tracingConfig?;
    get tracingConfig(): string;
    set tracingConfig(value: string);
    resetTracingConfig(): void;
    get tracingConfigInput(): string | undefined;
    protected synthesizeAttributes(): {
        [name: string]: any;
    };
    protected synthesizeHclAttributes(): {
        [name: string]: any;
    };
}

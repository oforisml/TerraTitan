import { sqsQueue } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { SqsQueueConfig } from ".";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import * as iam from "../iam";
export interface QueueProps extends AwsConstructProps, SqsQueueConfig {
    /**
     * Queue Name prefix
     *
     * Queue names must be made up of only uppercase and lowercase ASCII letters,
     * numbers, underscores, and hyphens, and must be between 1 and 80 characters
     * long.
     *
     * Terraform Prefixes must reserve 26 characters for the terraform generated suffix.
     *
     * For a FIFO (first-in-first-out) queue, the name must end with the .fifo
     * @default - GridUUID + Stack Unique Name
     */
    readonly namePrefix?: string;
    /**
     * Send messages to this queue if they were unsuccessfully dequeued a number of times.
     *
     * See [AWS Docs](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-dead-letter-queues.html)
     *
     * @default no dead-letter queue
     *
     * {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sqs_queue#redrive_policy SqsQueue#redrive_policy}
     */
    readonly deadLetterQueue?: DeadLetterQueue;
    /**
     * The string that includes the parameters for the permissions for the dead-letter queue
     * redrive permission and which source queues can specify dead-letter queues.
     *
     * @default - All source queues can designate this queue as their dead-letter queue.
     *
     * {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sqs_queue#redrive_allow_policy SqsQueue#redrive_allow_policy}
     */
    readonly redriveAllowPolicy?: RedriveAllowPolicy;
    /**
     * Whether this a first-in-first-out (FIFO) queue.
     *
     * @default false, unless nameSuffix ends in '.fifo' or 'contentBasedDeduplication' is true.
     */
    readonly fifo?: boolean;
    /**
     * Specifies whether to enable content-based deduplication.
     *
     * During the deduplication interval (5 minutes), Amazon SQS treats
     * messages that are sent with identical content (excluding attributes) as
     * duplicates and delivers only one copy of the message.
     *
     * If you don't enable content-based deduplication and you want to deduplicate
     * messages, provide an explicit deduplication ID in your SendMessage() call.
     *
     * (Only applies to FIFO queues.)
     *
     * @default false
     */
    readonly contentBasedDeduplication?: boolean;
    /**
     * For high throughput for FIFO queues, specifies whether message deduplication
     * occurs at the message group or queue level.
     *
     * (Only applies to FIFO queues.)
     *
     * @default DeduplicationScope.QUEUE
     */
    readonly deduplicationScope?: DeduplicationScope;
    /**
     * For high throughput for FIFO queues, specifies whether the FIFO queue
     * throughput quota applies to the entire queue or per message group.
     *
     * (Only applies to FIFO queues.)
     *
     * @default FifoThroughputLimit.PER_QUEUE
     */
    readonly fifoThroughputLimit?: FifoThroughputLimit;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface QueueOutputs {
    /**
     * Queue name
     */
    readonly name: string;
    /**
     * Queue arn
     */
    readonly arn: string;
    /**
     * Queue url
     */
    readonly url: string;
}
/**
 * Imported or created Queue attributes
 */
export interface IQueue extends iam.IAwsConstructWithPolicy {
    /** Strongly typed outputs */
    readonly queueOutputs: QueueOutputs;
    /**
     * The ARN of this queue
     * @attribute
     */
    readonly queueArn: string;
    /**
     * The URL of this queue
     * @attribute
     */
    readonly queueUrl: string;
    /**
     * The name of this queue
     * @attribute
     */
    readonly queueName: string;
    /**
     * If this queue is configured with a dead-letter queue, this is the dead-letter queue settings.
     */
    readonly deadLetterQueue?: DeadLetterQueue;
    /**
     * Whether this queue is an Amazon SQS FIFO queue. If false, this is a standard queue.
     */
    readonly fifo: boolean;
    /**
     * Grant permissions to consume messages from a queue
     *
     * This will grant the following permissions:
     *
     *   - sqs:ChangeMessageVisibility
     *   - sqs:DeleteMessage
     *   - sqs:ReceiveMessage
     *   - sqs:GetQueueAttributes
     *   - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant consume rights to
     */
    grantConsumeMessages(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant access to send messages to a queue to the given identity.
     *
     * This will grant the following permissions:
     *
     *  - sqs:SendMessage
     *  - sqs:GetQueueAttributes
     *  - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant send rights to
     */
    grantSendMessages(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant an IAM principal permissions to purge all messages from the queue.
     *
     * This will grant the following permissions:
     *
     *  - sqs:PurgeQueue
     *  - sqs:GetQueueAttributes
     *  - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant send rights to
     */
    grantPurge(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant the actions defined in queueActions to the identity Principal given
     * on this SQS queue resource.
     *
     * @param grantee Principal to grant right to
     * @param queueActions The actions to grant
     */
    grant(grantee: iam.IGrantable, ...queueActions: string[]): iam.Grant;
}
/**
 * The `Queue` beacon provides an [AWS SQS Queue](https://aws.amazon.com/sqs/).
 *
 * ```ts
 * new notify.Queue(stack, "Queue", {
 *   namePrefix: "queue.fifo",
 *   messageRetentionSeconds: Duration.days(14).toSeconds(),
 *   visibilityTimeoutSeconds: Duration.minutes(15).toSeconds(),
 * });
 * ```
 *
 * @resource aws_sqs_queue
 * @beacon-class notify.IQueue
 */
export declare class Queue extends AwsConstructBase implements IQueue {
    readonly resource: sqsQueue.SqsQueue;
    private readonly _outputs;
    get queueOutputs(): QueueOutputs;
    get outputs(): Record<string, any>;
    private policy?;
    get queueArn(): string;
    get queueUrl(): string;
    get queueName(): string;
    readonly deadLetterQueue?: DeadLetterQueue;
    /**
     * Whether this queue is an Amazon SQS FIFO queue. If false, this is a standard queue.
     */
    readonly fifo: boolean;
    constructor(scope: Construct, name: string, props?: QueueProps);
    /**
     * Adds a statement to the IAM resource policy associated with this queue.
     *
     * If this queue was created in this stack (`new Queue`), a queue policy
     * will be automatically created upon the first call to `addToPolicy`.
     */
    addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult;
    /**
     * Grant permissions to consume messages from a queue
     *
     * This will grant the following permissions:
     *
     *   - sqs:ChangeMessageVisibility
     *   - sqs:DeleteMessage
     *   - sqs:ReceiveMessage
     *   - sqs:GetQueueAttributes
     *   - sqs:GetQueueUrl
     *
     * If encryption is used, permission to use the key to decrypt the contents of the queue will also be granted to the same principal.
     *
     * This will grant the following KMS permissions:
     *
     *   - kms:Decrypt
     *
     * @param grantee Principal to grant consume rights to
     */
    grantConsumeMessages(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant access to send messages to a queue to the given identity.
     *
     * This will grant the following permissions:
     *
     *  - sqs:SendMessage
     *  - sqs:GetQueueAttributes
     *  - sqs:GetQueueUrl
     *
     * If encryption is used, permission to use the key to encrypt/decrypt the contents of the queue will also be granted to the same principal.
     *
     * This will grant the following KMS permissions:
     *
     *  - kms:Decrypt
     *  - kms:Encrypt
     *  - kms:ReEncrypt*
     *  - kms:GenerateDataKey*
     *
     * @param grantee Principal to grant send rights to
     */
    grantSendMessages(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant an IAM principal permissions to purge all messages from the queue.
     *
     * This will grant the following permissions:
     *
     *  - sqs:PurgeQueue
     *  - sqs:GetQueueAttributes
     *  - sqs:GetQueueUrl
     *
     * @param grantee Principal to grant send rights to
     */
    grantPurge(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant the actions defined in queueActions to the identity Principal given
     * on this SQS queue resource.
     *
     * @param grantee Principal to grant right to
     * @param actions The actions to grant
     */
    grant(grantee: iam.IGrantable, ...actions: string[]): iam.Grant;
    /**
     * Look at the props, see if the FIFO props agree, and return the correct subset of props
     */
    private determineFifoProps;
}
/**
 * Dead letter queue settings
 */
export interface DeadLetterQueue {
    /**
     * The dead-letter queue to which Amazon SQS moves messages after the value of maxReceiveCount is exceeded.
     */
    readonly queue: IQueue;
    /**
     * The number of times a message can be unsuccessfully dequeued before being moved to the dead-letter queue.
     */
    readonly maxReceiveCount: number;
}
/**
 * Permission settings for the dead letter source queue
 */
export interface RedriveAllowPolicy {
    /**
     * Permission settings for source queues that can designate this queue as their dead-letter queue.
     *
     * @default - `RedrivePermission.BY_QUEUE` if `sourceQueues` is specified,`RedrivePermission.ALLOW_ALL` otherwise.
     */
    readonly redrivePermission?: RedrivePermission;
    /**
     * Source queues that can designate this queue as their dead-letter queue.
     *
     * When `redrivePermission` is set to `RedrivePermission.BY_QUEUE`, this parameter is required.
     *
     * You can specify up to 10 source queues.
     * To allow more than 10 source queues to specify dead-letter queues, set the `redrivePermission` to
     * `RedrivePermission.ALLOW_ALL`.
     *
     * When `redrivePermission` is either `RedrivePermission.ALLOW_ALL` or `RedrivePermission.DENY_ALL`,
     * this parameter cannot be set.
     *
     * @default - Required when `redrivePermission` is `RedrivePermission.BY_QUEUE`, cannot be defined otherwise.
     */
    readonly sourceQueues?: IQueue[];
}
/**
 * The permission type that defines which source queues can specify the current queue as the dead-letter queue
 */
export declare enum RedrivePermission {
    /**
     * Any source queues in this AWS account in the same Region can specify this queue as the dead-letter queue
     */
    ALLOW_ALL = "allowAll",
    /**
     * No source queues can specify this queue as the dead-letter queue
     */
    DENY_ALL = "denyAll",
    /**
     * Only queues specified by the `sourceQueueArns` parameter can specify this queue as the dead-letter queue
     */
    BY_QUEUE = "byQueue"
}
/**
 * What kind of deduplication scope to apply
 */
export declare enum DeduplicationScope {
    /**
     * Deduplication occurs at the message group level
     */
    MESSAGE_GROUP = "messageGroup",
    /**
     * Deduplication occurs at the message queue level
     */
    QUEUE = "queue"
}
/**
 * Whether the FIFO queue throughput quota applies to the entire queue or per message group
 */
export declare enum FifoThroughputLimit {
    /**
     * Throughput quota applies per queue
     */
    PER_QUEUE = "perQueue",
    /**
     * Throughput quota applies per message group id
     */
    PER_MESSAGE_GROUP_ID = "perMessageGroupId"
}

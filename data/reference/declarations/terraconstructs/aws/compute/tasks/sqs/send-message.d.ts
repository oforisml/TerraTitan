import { Construct } from "constructs";
import * as compute from "../../";
import { Duration } from "../../../../duration";
import * as iam from "../../../iam";
import * as notify from "../../../notify";
/**
 * Properties for sending a message to an SQS queue
 */
export interface SqsSendMessageProps extends compute.TaskStateBaseProps {
    /**
     * The SQS queue that messages will be sent to
     */
    readonly queue: notify.IQueue;
    /**
     * The text message to send to the queue.
     */
    readonly messageBody: compute.TaskInput;
    /**
     * The length of time, for which to delay a message.
     * Messages that you send to the queue remain invisible to consumers for the duration
     * of the delay period. The maximum allowed delay is 15 minutes.
     *
     * @default - delay set on the queue. If a delay is not set on the queue,
     *   messages are sent immediately (0 seconds).
     */
    readonly delay?: Duration;
    /**
     * The token used for deduplication of sent messages.
     * Any messages sent with the same deduplication ID are accepted successfully,
     * but aren't delivered during the 5-minute deduplication interval.
     *
     * @default - None
     */
    readonly messageDeduplicationId?: string;
    /**
     * The tag that specifies that a message belongs to a specific message group.
     *
     * Messages that belong to the same message group are processed in a FIFO manner.
     * Messages in different message groups might be processed out of order.
     *
     * @default - None
     */
    readonly messageGroupId?: string;
}
/**
 * A StepFunctions Task to send messages to SQS queue.
 *
 */
export declare class SqsSendMessage extends compute.TaskStateBase {
    private readonly props;
    private static readonly SUPPORTED_INTEGRATION_PATTERNS;
    protected readonly taskPolicies?: iam.PolicyStatement[];
    private readonly integrationPattern;
    constructor(scope: Construct, id: string, props: SqsSendMessageProps);
    /**
     * Provides the SQS SendMessage service integration task configuration
     */
    /**
     * @internal
     */
    protected _renderTask(): any;
}

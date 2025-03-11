import * as compute from "..";
import * as storage from "../../storage";
export interface S3EventSourceProps {
    /**
     * The s3 event types that will trigger the notification.
     */
    readonly events: storage.EventType[];
    /**
     * S3 object key filter rules to determine which objects trigger this event.
     * Each filter must include a `prefix` and/or `suffix` that will be matched
     * against the s3 object key. Refer to the S3 Developer Guide for details
     * about allowed filter rules.
     */
    readonly filters?: storage.NotificationKeyFilter[];
}
/**
 * Use S3 bucket notifications as an event source for AWS Lambda.
 */
export declare class S3EventSource implements compute.IEventSource {
    private readonly bucket;
    private readonly props;
    constructor(bucket: storage.IBucket, props: S3EventSourceProps);
    bind(target: compute.IFunction): void;
}

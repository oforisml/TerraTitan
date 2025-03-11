import { Construct } from "constructs";
import * as storage from "..";
import { IQueue } from "../../notify";
/**
 * Use an SQS queue as a bucket notification destination
 */
export declare class QueueDestination implements storage.IBucketNotificationDestination {
    private readonly queue;
    constructor(queue: IQueue);
    /**
     * Allows using SQS queues as destinations for bucket notifications.
     * Use `bucket.onEvent(event, queue)` to subscribe.
     */
    bind(_scope: Construct, bucket: storage.IBucket): storage.BucketNotificationDestinationConfig;
}

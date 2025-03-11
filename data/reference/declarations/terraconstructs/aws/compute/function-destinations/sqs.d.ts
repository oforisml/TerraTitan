import { Construct } from "constructs";
import * as compute from "..";
import * as notify from "../../notify";
/**
 * Use a SQS queue as a Lambda destination
 */
export declare class SqsDestination implements compute.IDestination {
    private readonly queue;
    constructor(queue: notify.IQueue);
    /**
     * Returns a destination configuration
     */
    bind(_scope: Construct, fn: compute.IFunction, _options?: compute.DestinationOptions): compute.DestinationConfig;
}

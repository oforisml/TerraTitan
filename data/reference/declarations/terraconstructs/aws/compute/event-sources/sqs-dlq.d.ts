import { DlqDestinationConfig, IEventSourceDlq, IEventSourceMapping, IFunction } from "../";
import * as notify from "../../notify";
/**
 * An SQS dead letter queue destination configuration for a Lambda event source
 */
export declare class SqsDlq implements IEventSourceDlq {
    private readonly queue;
    constructor(queue: notify.IQueue);
    /**
     * Returns a destination configuration for the DLQ
     */
    bind(_target: IEventSourceMapping, targetHandler: IFunction): DlqDestinationConfig;
}

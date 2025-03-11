import { DlqDestinationConfig, IEventSourceDlq, IEventSourceMapping, IFunction } from "../";
import * as storage from "../../storage";
/**
 * An S3 dead letter bucket destination configuration for a Lambda event source
 */
export declare class S3OnFailureDestination implements IEventSourceDlq {
    private readonly bucket;
    constructor(bucket: storage.IBucket);
    /**
     * Returns a destination configuration for the DLQ
     */
    bind(_target: IEventSourceMapping, targetHandler: IFunction): DlqDestinationConfig;
}

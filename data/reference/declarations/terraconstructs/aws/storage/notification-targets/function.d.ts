import { Construct } from "constructs";
import * as storage from "..";
import { IFunction } from "../../compute";
/**
 * Use a Lambda function as a bucket notification destination
 */
export declare class FunctionDestination implements storage.IBucketNotificationDestination {
    private readonly fn;
    constructor(fn: IFunction);
    bind(_scope: Construct, bucket: storage.IBucket): storage.BucketNotificationDestinationConfig;
}

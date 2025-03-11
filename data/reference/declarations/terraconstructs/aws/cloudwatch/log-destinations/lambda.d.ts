import { Construct } from "constructs";
import * as logs from "..";
import * as compute from "../../compute";
/**
 * Options that may be provided to LambdaDestination
 */
export interface LambdaDestinationOptions {
    /** Whether or not to add Lambda Permissions.
     * @default true
     */
    readonly addPermissions?: boolean;
}
/**
 * Use a Lambda Function as the destination for a log subscription
 */
export declare class LambdaDestination implements logs.ILogSubscriptionDestination {
    private readonly fn;
    private readonly options;
    /**  LambdaDestinationOptions */
    constructor(fn: compute.IFunction, options?: LambdaDestinationOptions);
    bind(scope: Construct, logGroup: logs.ILogGroup): logs.LogSubscriptionDestinationConfig;
}

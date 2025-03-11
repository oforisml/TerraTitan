import { Construct } from "constructs";
import * as compute from "..";
/**
 * Options for a Lambda destination
 */
export interface FunctionDestinationOptions {
    /**
     * Whether the destination function receives only the `responsePayload` of
     * the source function.
     *
     * When set to `true` and used as `onSuccess` destination, the destination
     * function will be invoked with the payload returned by the source function.
     *
     * When set to `true` and used as `onFailure` destination, the destination
     * function will be invoked with the error object returned by source function.
     *
     * See the README of this module to see a full explanation of this option.
     *
     * @default false The destination function receives the full invocation record.
     */
    readonly responseOnly?: boolean;
}
/**
 * Use a Lambda function as a Lambda destination
 */
export declare class FunctionDestination implements compute.IDestination {
    private readonly fn;
    private readonly options;
    constructor(fn: compute.IFunction, options?: FunctionDestinationOptions);
    /**
     * Returns a destination configuration
     */
    bind(scope: Construct, fn: compute.IFunction, options?: compute.DestinationOptions): compute.DestinationConfig;
}

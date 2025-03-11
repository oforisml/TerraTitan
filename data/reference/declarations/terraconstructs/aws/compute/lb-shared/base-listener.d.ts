import { Construct } from "constructs";
import { LoadBalancerType, LoadBalancerListenerProtocol } from "./grid-lookup-types";
import { LbListenerConfig } from "./lb-listener-config.generated";
import { IListenerAction } from "./listener-action";
import { IAwsConstruct, AwsConstructBase } from "../../aws-construct";
/**
 * Options for listener lookup
 */
export interface BaseListenerLookupOptions {
    /**
     * Filter listeners by associated load balancer arn
     * @default - does not filter by load balancer arn
     */
    readonly loadBalancerArn?: string;
    /**
     * Filter listeners by associated load balancer tags
     * @default - does not filter by load balancer tags
     */
    readonly loadBalancerTags?: Record<string, string>;
    /**
     * Filter listeners by listener port
     * @default - does not filter by listener port
     */
    readonly listenerPort?: number;
}
/**
 * Options for querying the load balancer listener context provider
 * @internal
 */
export interface ListenerQueryContextProviderOptions {
    /**
     * User's provided options
     */
    readonly userOptions: BaseListenerLookupOptions;
    /**
     * Type of load balancer expected
     */
    readonly loadBalancerType: LoadBalancerType;
    /**
     * ARN of the listener to look up
     * @default - does not filter by listener arn
     */
    readonly listenerArn?: string;
    /**
     * Optional protocol of the listener to look up
     */
    readonly listenerProtocol?: LoadBalancerListenerProtocol;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface ListenerOutputs {
    /**
     * ARN of the listener
     * @attribute
     */
    readonly listenerArn: string;
}
/**
 * Base interface for listeners
 */
export interface IListener extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly listenerOutputs: ListenerOutputs;
    /**
     * ARN of the listener
     * @attribute
     */
    readonly listenerArn: string;
}
/**
 * Base class for listeners
 */
export declare abstract class BaseListener extends AwsConstructBase implements IListener {
    /**
     * Strongly typed outputs
     */
    get listenerOutputs(): ListenerOutputs;
    get outputs(): Record<string, any>;
    /**
     * @attribute
     */
    readonly listenerArn: string;
    /**
     * Attributes set on this listener
     */
    private readonly attributes;
    private defaultAction?;
    constructor(scope: Construct, id: string, additionalProps: LbListenerConfig);
    /**
     * Set a non-standard attribute on the listener
     *
     * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticloadbalancingv2-listener-listenerattribute.html
     */
    setAttribute(key: string, value: string | undefined): void;
    /**
     * Remove an attribute from the listener
     */
    removeAttribute(key: string): void;
    private lazyStringAttr;
    private lazyBoolAttr;
    private lazyNumberAttr;
    /**
     * Validate this listener
     */
    protected validateListener(): string[];
    /**
     * Configure the default action
     *
     * @internal
     */
    protected _setDefaultAction(action: IListenerAction): void;
}

import { cloudwatchLogSubscriptionFilter } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { ILogGroup, SubscriptionFilterOptions } from "./log-group";
import * as iam from "../iam";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface LogSubscriptionDestinationOutputs {
    /**
     * The arn of this log group
     * @attribute
     */
    readonly logGroupArn: string;
    /**
     * The name of this log group
     * @attribute
     */
    readonly logGroupName: string;
}
/**
 * Interface for classes that can be the destination of a log Subscription
 */
export interface ILogSubscriptionDestination {
    /**
     * Return the properties required to send subscription events to this destination.
     *
     * If necessary, the destination can use the properties of the SubscriptionFilter
     * object itself to configure its permissions to allow the subscription to write
     * to it.
     *
     * The destination may reconfigure its own permissions in response to this
     * function call.
     */
    bind(scope: Construct, sourceLogGroup: ILogGroup): LogSubscriptionDestinationConfig;
}
/**
 * Properties returned by a Subscription destination
 */
export interface LogSubscriptionDestinationConfig {
    /**
     * The ARN of the subscription's destination
     */
    readonly arn: string;
    /**
     * The role to assume to write log events to the destination
     *
     * @default No role assumed
     */
    readonly role?: iam.IRole;
    /**
     * Dependencies required for subscription filter creation to succeed
     */
    readonly dependencies?: Construct[];
}
/**
 * Properties for a SubscriptionFilter
 */
export interface SubscriptionFilterProps extends SubscriptionFilterOptions, AwsConstructProps {
    /**
     * The log group to create the subscription on.
     */
    readonly logGroup: ILogGroup;
}
/**
 * A new Subscription on a CloudWatch log group.
 */
export declare class SubscriptionFilter extends AwsConstructBase {
    resource: cloudwatchLogSubscriptionFilter.CloudwatchLogSubscriptionFilter;
    /**
     * This resource exports no additional attributes.
     */
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: SubscriptionFilterProps);
}

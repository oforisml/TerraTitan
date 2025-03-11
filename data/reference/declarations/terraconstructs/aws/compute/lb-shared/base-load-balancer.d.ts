import { lb as tfLoadBalancer } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import * as ec2 from "../";
import { LoadBalancerType } from "./grid-lookup-types";
import { IAwsConstruct, AwsConstructBase, AwsConstructProps } from "../../aws-construct";
import * as iam from "../../iam";
import * as s3 from "../../storage";
/**
 * Shared properties of both Application and Network Load Balancers
 */
export interface BaseLoadBalancerProps extends AwsConstructProps {
    /**
     * Name of the load balancer
     *
     * @default - Automatically generated name.
     */
    readonly loadBalancerName?: string;
    /**
     * The VPC network to place the load balancer in
     */
    readonly vpc: ec2.IVpc;
    /**
     * Whether the load balancer has an internet-routable address
     *
     * @default false
     */
    readonly internetFacing?: boolean;
    /**
     * Which subnets place the load balancer in
     *
     * @default - the Vpc default strategy.
     *
     */
    readonly vpcSubnets?: ec2.SubnetSelection;
    /**
     * Indicates whether deletion protection is enabled.
     *
     * @default false
     */
    readonly deletionProtection?: boolean;
    /**
     * Indicates whether cross-zone load balancing is enabled.
     *
     * @default - false for Network Load Balancers and true for Application Load Balancers.
     * This can not be `false` for Application Load Balancers.
     * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticloadbalancingv2-loadbalancer-loadbalancerattribute.html
     */
    readonly crossZoneEnabled?: boolean;
    /**
     * Indicates whether the load balancer blocks traffic through the Internet Gateway (IGW).
     *
     * @default - false for internet-facing load balancers and true for internal load balancers
     */
    readonly denyAllIgwTraffic?: boolean;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface LoadBalancerV2Outputs {
    /**
     * The canonical hosted zone ID of this load balancer
     *
     * Example value: `Z2P70J7EXAMPLE`
     *
     * @attribute
     */
    readonly loadBalancerCanonicalHostedZoneId: string;
    /**
     * The DNS name of this load balancer
     *
     * Example value: `my-load-balancer-424835706.us-west-2.elb.amazonaws.com`
     *
     * @attribute
     */
    readonly loadBalancerDnsName: string;
}
export interface ILoadBalancerV2 extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly loadBalancerV2Outputs: LoadBalancerV2Outputs;
    /**
     * The canonical hosted zone ID of this load balancer
     *
     * Example value: `Z2P70J7EXAMPLE`
     *
     * @attribute
     */
    readonly loadBalancerCanonicalHostedZoneId: string;
    /**
     * The DNS name of this load balancer
     *
     * Example value: `my-load-balancer-424835706.us-west-2.elb.amazonaws.com`
     *
     * @attribute
     */
    readonly loadBalancerDnsName: string;
}
/**
 * Options for looking up load balancers
 */
export interface BaseLoadBalancerLookupOptions {
    /**
     * Find by load balancer's ARN
     * @default - does not search by load balancer arn
     */
    readonly loadBalancerArn?: string;
    /**
     * Match load balancer tags.
     * @default - does not match load balancers by tags
     */
    readonly loadBalancerTags?: Record<string, string>;
}
/**
 * Options for query context provider
 * @internal
 */
export interface LoadBalancerQueryContextProviderOptions {
    /**
     * User's lookup options
     */
    readonly userOptions: BaseLoadBalancerLookupOptions;
    /**
     * Type of load balancer
     */
    readonly loadBalancerType: LoadBalancerType;
}
/**
 * Base class for both Application and Network Load Balancers
 */
export declare abstract class BaseLoadBalancer extends AwsConstructBase {
    get loadBalancerV2Outputs(): LoadBalancerV2Outputs;
    get outputs(): Record<string, any>;
    /**
     * The canonical hosted zone ID of this load balancer
     *
     * Example value: `Z2P70J7EXAMPLE`
     *
     * @attribute
     */
    readonly loadBalancerCanonicalHostedZoneId: string;
    /**
     * The DNS name of this load balancer
     *
     * Example value: `my-load-balancer-424835706.us-west-2.elb.amazonaws.com`
     *
     * @attribute
     */
    readonly loadBalancerDnsName: string;
    /**
     * The full name of this load balancer
     *
     * Example value: `app/my-load-balancer/50dc6c495c0c9188`
     *
     * @attribute
     */
    readonly loadBalancerFullName: string;
    /**
     * The name of this load balancer
     *
     * Example value: `my-load-balancer`
     *
     * @attribute
     */
    readonly loadBalancerName: string;
    /**
     * The ARN of this load balancer
     *
     * Example value: `arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/my-internal-load-balancer/50dc6c495c0c9188`
     *
     * @attribute
     */
    readonly loadBalancerArn: string;
    /**
     * @attribute
     */
    readonly loadBalancerSecurityGroups: string[];
    /**
     * The VPC this load balancer has been created in.
     *
     * This property is always defined (not `null` or `undefined`) for sub-classes of `BaseLoadBalancer`.
     */
    readonly vpc?: ec2.IVpc;
    /**
     * Attributes set on this load balancer
     */
    private readonly attributes;
    private readonly physicalName;
    constructor(scope: Construct, id: string, baseProps: BaseLoadBalancerProps, additionalProps: tfLoadBalancer.LbConfig);
    /**
     * Enable access logging for this load balancer.
     *
     * A region must be specified on the stack containing the load balancer; you cannot enable logging on
     * environment-agnostic stacks. See https://docs.aws.amazon.com/cdk/latest/guide/environments.html
     */
    logAccessLogs(bucket: s3.IBucket, prefix?: string): void;
    /**
     * Set a non-standard attribute on the load balancer
     *
     * Use the dedicated logAccessLogs() method intead of setAttribute if you want to setup access logging.
     *
     * @see https://docs.aws.amazon.com/elasticloadbalancing/latest/application/application-load-balancers.html#load-balancer-attributes
     */
    setAttribute(key: string, value: string | undefined): void;
    /**
     * Remove an attribute from the load balancer
     */
    removeAttribute(key: string): void;
    protected lazyStringAttr(key: string): string;
    protected lazyBoolAttr(key: string): import("cdktf").IResolvable;
    protected lazyNumberAttr(key: string): number;
    protected resourcePolicyPrincipal(): iam.IPrincipal;
    protected validateLoadBalancer(): string[];
}

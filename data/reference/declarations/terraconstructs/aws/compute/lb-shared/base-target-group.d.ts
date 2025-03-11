import { lbTargetGroup as tfTargetGroup } from "@cdktf/provider-aws";
import { Construct, DependencyGroup, IConstruct, IDependable } from "constructs";
import { IVpc } from "../vpc";
import { LbProtocol, TargetType } from "./enums";
import { LbTargetGroupAttachmentConfig } from "./lb-target-group-attachment-config.generated";
import { Duration } from "../../../duration";
import { AwsConstructBase, AwsConstructProps } from "../../aws-construct";
/**
 * The IP address type of targets registered with a target group
 */
export declare enum TargetGroupIpAddressType {
    /**
     * IPv4 addresses
     */
    IPV4 = "ipv4",
    /**
     * IPv6 addresses
     */
    IPV6 = "ipv6"
}
/**
 * Basic properties of both Application and Network Target Groups
 */
export interface BaseTargetGroupProps extends AwsConstructProps {
    /**
     * The name of the target group.
     *
     * This name must be unique per region per account, can have a maximum of
     * 32 characters, must contain only alphanumeric characters or hyphens, and
     * must not begin or end with a hyphen.
     *
     * @default - Automatically generated.
     */
    readonly targetGroupName?: string;
    /**
     * The virtual private cloud (VPC).
     *
     * only if `TargetType` is `Ip` or `InstanceId`
     *
     * @default - undefined
     */
    readonly vpc?: IVpc;
    /**
     * The amount of time for Elastic Load Balancing to wait before deregistering a target.
     *
     * The range is 0-3600 seconds.
     *
     * @default 300
     */
    readonly deregistrationDelay?: Duration;
    /**
     * Health check configuration
     *
     * @default - The default value for each property in this configuration varies depending on the target.
     * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-elasticloadbalancingv2-targetgroup.html#aws-resource-elasticloadbalancingv2-targetgroup-properties
     */
    readonly healthCheck?: HealthCheck;
    /**
     * The type of targets registered to this TargetGroup, either IP or Instance.
     *
     * All targets registered into the group must be of this type. If you
     * register targets to the TargetGroup in the CDK app, the TargetType is
     * determined automatically.
     *
     * @default - Determined automatically.
     */
    readonly targetType?: TargetType;
    /**
     * Indicates whether cross zone load balancing is enabled.
     *
     * @default - use load balancer configuration
     * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-elasticloadbalancingv2-targetgroup-targetgroupattribute.html
     */
    readonly crossZoneEnabled?: boolean;
    /**
     * The type of IP addresses of the targets registered with the target group.
     *
     * @default undefined - ELB defaults to IPv4
     */
    readonly ipAddressType?: TargetGroupIpAddressType;
}
/**
 * Properties for configuring a health check
 */
export interface HealthCheck {
    /**
     * Indicates whether health checks are enabled. If the target type is lambda,
     * health checks are disabled by default but can be enabled. If the target type
     * is instance or ip, health checks are always enabled and cannot be disabled.
     *
     * @default - Determined automatically.
     */
    readonly enabled?: boolean;
    /**
     * The approximate number of seconds between health checks for an individual target.
     * Must be 5 to 300 seconds
     *
     * @default - 10 seconds if protocol is `GENEVE`, 35 seconds if target type is `lambda`, else 30 seconds
     */
    readonly interval?: Duration;
    /**
     * The ping path destination where Elastic Load Balancing sends health check requests.
     *
     * @default /
     */
    readonly path?: string;
    /**
     * The port that the load balancer uses when performing health checks on the targets.
     *
     * @default 'traffic-port'
     */
    readonly port?: string;
    /**
     * The protocol the load balancer uses when performing health checks on targets.
     *
     * The TCP protocol is supported for health checks only if the protocol of the target group is TCP, TLS, UDP, or TCP_UDP.
     * The TLS, UDP, and TCP_UDP protocols are not supported for health checks.
     *
     * @default - HTTP for ALBs, TCP for NLBs
     */
    readonly protocol?: LbProtocol;
    /**
     * The amount of time, in seconds, during which no response from a target means a failed health check.
     * Must be 2 to 120 seconds.
     *
     * @default - 6 seconds if the protocol is HTTP, 5 seconds if protocol is `GENEVE`, 30 seconds if target type is `lambda`, 10 seconds for TCP, TLS, or HTTPS
     */
    readonly timeout?: Duration;
    /**
     * The number of consecutive health checks successes required before considering an unhealthy target healthy.
     *
     * For Application Load Balancers, the default is 5. For Network Load Balancers, the default is 3.
     *
     * @default - 5 for ALBs, 3 for NLBs
     */
    readonly healthyThresholdCount?: number;
    /**
     * The number of consecutive health check failures required before considering a target unhealthy.
     *
     * For Application Load Balancers, the default is 2. For Network Load
     * Balancers, the range is between 2-10 and can be set accordingly.
     *
     * @default 2
     */
    readonly unhealthyThresholdCount?: number;
    /**
     * GRPC code to use when checking for a successful response from a target.
     *
     * You can specify values between 0 and 99. You can specify multiple values
     * (for example, "0,1") or a range of values (for example, "0-5").
     *
     * @default 12
     */
    readonly healthyGrpcCodes?: string;
    /**
     * HTTP code to use when checking for a successful response from a target.
     *
     * For Application Load Balancers, you can specify values between 200 and
     * 499, and the default value is 200. You can specify multiple values (for
     * example, "200,202") or a range of values (for example, "200-299").
     */
    readonly healthyHttpCodes?: string;
}
export interface TargetGroupOutputs {
    /**
     * ARN of the target group
     */
    readonly targetGroupArn: string;
    /**
     * The full name of the target group
     */
    readonly targetGroupFullName: string;
    /**
     * The name of the target group
     */
    readonly targetGroupName: string;
    /**
     * ARNs of load balancers load balancing to this TargetGroup
     */
    readonly targetGroupLoadBalancerArns: string[];
    /**
     * Full name of first load balancer
     *
     * This identifier is emitted as a dimensions of the metrics of this target
     * group.
     *
     * Example value: `app/my-load-balancer/123456789`
     */
    readonly firstLoadBalancerFullName: string;
}
/**
 * Define the target of a load balancer
 */
export declare abstract class TargetGroupBase extends AwsConstructBase implements ITargetGroup {
    get targetGroupOutputs(): TargetGroupOutputs;
    get outputs(): Record<string, any>;
    /**
     * The ARN of the target group
     */
    readonly targetGroupArn: string;
    /**
     * The full name of the target group
     */
    readonly targetGroupFullName: string;
    /**
     * The name of the target group
     */
    readonly targetGroupName: string;
    /**
     * ARNs of load balancers load balancing to this TargetGroup
     */
    readonly targetGroupLoadBalancerArns: string[];
    /**
     * Full name of first load balancer
     *
     * This identifier is emitted as a dimensions of the metrics of this target
     * group.
     *
     * Example value: `app/my-load-balancer/123456789`
     */
    abstract readonly firstLoadBalancerFullName: string;
    /**
     * A token representing a list of ARNs of the load balancers that route traffic to this target group
     */
    readonly loadBalancerArns: string;
    /**
     * Health check for the members of this target group
     */
    healthCheck: HealthCheck;
    /**
     * Default port configured for members of this target group
     */
    protected readonly defaultPort: number;
    /**
     * Configurable dependable with all resources that lead to load balancer attachment
     */
    protected readonly loadBalancerAttachedDependencies: DependencyGroup;
    /**
     * The types of the directly registered members of this target group
     */
    protected targetType?: TargetType;
    /**
     * Attributes of this target group
     */
    private readonly attributes;
    /**
     * The JSON objects returned by the directly registered members of this target group
     */
    private readonly targetsJson;
    /**
     * The target group VPC
     *
     * @default - Required if adding instances instead of Lambdas to TargetGroup
     */
    private vpc?;
    /**
     * The protocol version to use
     *
     * Only applicable when protocol is HTTP or HTTPS. The protocol version.
     *
     * Specify GRPC to send requests to targets using gRPC.
     * Specify HTTP2 to send requests to targets using HTTP/2.
     *
     * The default is HTTP1, which sends requests to targets using HTTP/1.1
     *
     * @default "HTTP1"
     */
    private readonly protocolVersion?;
    /**
     * The target group resource
     */
    readonly resource: tfTargetGroup.LbTargetGroup;
    /**
     * @param additionalProps healthCheck, stickiness, targetGroupHealth are controlled by methods and ignored
     */
    constructor(scope: Construct, id: string, baseProps: BaseTargetGroupProps, additionalProps: tfTargetGroup.LbTargetGroupConfig);
    /**
     * List of constructs that need to be depended on to ensure the TargetGroup is associated to a load balancer
     */
    get loadBalancerAttached(): IDependable;
    /**
     * Set/replace the target group's health check
     */
    configureHealthCheck(healthCheck: HealthCheck): void;
    /**
     * AWS CDK specific way of setting non-standard attribute on the target group
     *
     * Prefer to use dedicated methods like `configureHealthCheck` or `setAttribute`
     *
     * @see https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html#target-group-attributes
     */
    setAttribute(key: string, value: string | undefined): void;
    /**
     * Register the given load balancing target as part of this group
     */
    protected addLoadBalancerTarget(props: LoadBalancerTargetProps): void;
    protected validateTargetGroup(): string[];
    protected validateHealthCheck(): string[];
    private lazyStringAttr;
    private lazyBoolAttr;
    private lazyNumberAttr;
    /**
     * Adds resource to the terraform JSON output.
     *
     * called by TerraformStack.prepareStack()
     */
    toTerraform(): any;
}
/**
 * Properties to reference an existing target group
 */
export interface TargetGroupAttributes {
    /**
     * ARN of the target group
     */
    readonly targetGroupArn: string;
    /**
     * Port target group is listening on
     *
     * @deprecated - This property is unused and the wrong type. No need to use it.
     */
    readonly defaultPort?: string;
    /**
     * A Token representing the list of ARNs for the load balancer routing to this target group
     */
    readonly loadBalancerArns?: string;
}
/**
 * Properties to reference an existing target group
 *
 * @deprecated Use TargetGroupAttributes instead
 */
export interface TargetGroupImportProps extends TargetGroupAttributes {
}
/**
 * A target group
 */
export interface ITargetGroup extends IConstruct {
    /**
     * The name of the target group
     */
    readonly targetGroupName: string;
    /**
     * ARN of the target group
     */
    readonly targetGroupArn: string;
    /**
     * A token representing a list of ARNs of the load balancers that route traffic to this target group
     */
    readonly loadBalancerArns: string;
    /**
     * Return an object to depend on the listeners added to this target group
     */
    readonly loadBalancerAttached: IDependable;
}
/**
 * Result of attaching a target to load balancer
 */
export interface LoadBalancerTargetProps {
    /**
     * What kind of target this is
     */
    readonly targetType: TargetType;
    /**
     * JSON representing the target's direct addition to the TargetGroup list
     *
     * May be omitted if the target is going to register itself later.
     */
    readonly targetJson?: LbTargetGroupAttachmentConfig;
}
/**
 * Extract the full load balancer name (used for metrics) from the listener ARN:
 *
 * Turns
 *
 *     arn:aws:elasticloadbalancing:us-west-2:123456789012:listener/app/my-load-balancer/50dc6c495c0c9188/f2f7dc8efc522ab2
 *
 * Into
 *
 *     app/my-load-balancer/50dc6c495c0c9188
 */
export declare function loadBalancerNameFromListenerArn(listenerArn: string): string;

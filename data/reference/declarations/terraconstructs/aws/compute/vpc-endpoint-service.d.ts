import { Construct } from "constructs";
import { IAwsConstruct, AwsConstructBase } from "../aws-construct";
import { IDnsZone } from "../edge";
import { ArnPrincipal } from "../iam";
/**
 * A load balancer that can host a VPC Endpoint Service
 *
 */
export interface IVpcEndpointServiceLoadBalancer {
    /**
     * The ARN of the load balancer that hosts the VPC Endpoint Service
     *
     * @attribute
     */
    readonly loadBalancerArn: string;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface VpcEndpointServiceOutputs {
    /**
     * The service name of the VPC Endpoint Service that clients use to connect to,
     * like com.amazonaws.vpce.<region>.vpce-svc-xxxxxxxxxxxxxxxx
     *
     * @attribute
     */
    readonly vpcEndpointServiceName: string;
    /**
     * The id of the VPC Endpoint Service that clients use to connect to,
     * like vpce-svc-xxxxxxxxxxxxxxxx
     *
     * @attribute
     */
    readonly vpcEndpointServiceId: string;
}
/**
 * A VPC endpoint service.
 *
 */
export interface IVpcEndpointService extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly vpcEndpointServiceOutputs: VpcEndpointServiceOutputs;
    /**
     * The service name of the VPC Endpoint Service that clients use to connect to,
     * like com.amazonaws.vpce.<region>.vpce-svc-xxxxxxxxxxxxxxxx
     *
     * @attribute
     */
    readonly vpcEndpointServiceName: string;
    /**
     * The id of the VPC Endpoint Service that clients use to connect to,
     * like vpce-svc-xxxxxxxxxxxxxxxx
     *
     * @attribute
     */
    readonly vpcEndpointServiceId: string;
}
/**
 * A VPC endpoint service
 * @resource aws_vpc_endpoint_service
 *
 */
export declare class VpcEndpointService extends AwsConstructBase implements IVpcEndpointService {
    /**
     * The default value for a VPC Endpoint Service name prefix, useful if you do
     * not have a synthesize-time region literal available.
     */
    static readonly DEFAULT_PREFIX = "com.amazonaws.vpce";
    /**
     * One or more network load balancers to host the service.
     * @attribute
     */
    readonly vpcEndpointServiceLoadBalancers: IVpcEndpointServiceLoadBalancer[];
    /**
     * Whether to require manual acceptance of new connections to the service.
     *
     */
    readonly acceptanceRequired: boolean;
    /**
     * One or more Principal ARNs to allow inbound connections to.
     * @deprecated use `allowedPrincipals`
     */
    readonly whitelistedPrincipals: ArnPrincipal[];
    /**
     * One or more Principal ARNs to allow inbound connections to.
     *
     */
    readonly allowedPrincipals: ArnPrincipal[];
    /**
     * The id of the VPC Endpoint Service, like vpce-svc-xxxxxxxxxxxxxxxx.
     * @attribute
     */
    readonly vpcEndpointServiceId: string;
    /**
     * The service name of the VPC Endpoint Service that clients use to connect to,
     * like com.amazonaws.vpce.<region>.vpce-svc-xxxxxxxxxxxxxxxx
     *
     * @attribute
     */
    readonly vpcEndpointServiceName: string;
    get vpcEndpointServiceOutputs(): VpcEndpointServiceOutputs;
    get outputs(): Record<string, any>;
    private readonly endpointService;
    constructor(scope: Construct, id: string, props: VpcEndpointServiceProps);
}
/**
 * Construction properties for a VpcEndpointService.
 *
 */
export interface VpcEndpointServiceProps {
    /**
     * The private DNS name for the service.
     */
    readonly privateDnsName?: string;
    /**
     * Zone to validate the domain ownership.
     *
     * required if `privateDnsName` is set
     */
    readonly dnsZone?: IDnsZone;
    /**
     * One or more load balancers to host the VPC Endpoint Service.
     *
     */
    readonly vpcEndpointServiceLoadBalancers: IVpcEndpointServiceLoadBalancer[];
    /**
     * Whether requests from service consumers to connect to the service through
     * an endpoint must be accepted.
     * @default true
     *
     */
    readonly acceptanceRequired?: boolean;
    /**
     * IAM users, IAM roles, or AWS accounts to allow inbound connections from.
     * These principals can connect to your service using VPC endpoints. Takes a
     * list of one or more ArnPrincipal.
     * @default - no principals
     * @deprecated use `allowedPrincipals`
     */
    readonly whitelistedPrincipals?: ArnPrincipal[];
    /**
     * IAM users, IAM roles, or AWS accounts to allow inbound connections from.
     * These principals can connect to your service using VPC endpoints. Takes a
     * list of one or more ArnPrincipal.
     * @default - no principals
     *
     */
    readonly allowedPrincipals?: ArnPrincipal[];
}

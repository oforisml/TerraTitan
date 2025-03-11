import { egressOnlyInternetGateway as tfEgressOnlyInternetGateway, internetGateway as tfInternetGateway, natGateway as tfNatGateway, vpcPeeringConnection as tfVpcPeeringConnection, route as tfRoute, routeTable as tfRouteTable, vpnGateway as tfVpnGateway } from "@cdktf/provider-aws";
import { Construct, IDependable } from "constructs";
import { IRouteTable, RouterType, RouteTableOutputs } from "./vpc";
import { IVpcEndpoint, VpcEndpointOutputs } from "./vpc-endpoint";
import { Duration } from "../../duration";
import { AwsConstructBase, AwsConstructProps, IAwsConstruct } from "../aws-construct";
import { ISubnetV2 } from "./subnet-v2";
import { IVpcV2, VPNGatewayV2Options } from "./vpc-v2-base";
/**
 * Indicates whether the NAT gateway supports public or private connectivity.
 * The default is public connectivity.
 * See: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-natgateway.html#cfn-ec2-natgateway-connectivitytype
 */
export declare enum NatConnectivityType {
    /**
     * Sets Connectivity type to PUBLIC
     */
    PUBLIC = "public",
    /**
     * Sets Connectivity type to PRIVATE
     */
    PRIVATE = "private"
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface RouteTargetOutputs {
    /**
     * The type of router used in the route.
     *
     * @attribute
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     *
     * @attribute
     */
    readonly routerTargetId: string;
}
/**
 * Interface to define a routing target, such as an
 * egress-only internet gateway or VPC endpoint.
 */
export interface IRouteTarget extends IDependable {
    /**
     * The outputs of the route target.
     */
    readonly routeTargetOutputs: RouteTargetOutputs;
    /**
     * The type of router used in the route.
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     */
    readonly routerTargetId: string;
}
/**
 * Properties to define an egress-only internet gateway.
 */
export interface EgressOnlyInternetGatewayProps {
    /**
     * The ID of the VPC for which to create the egress-only internet gateway.
     */
    readonly vpc: IVpcV2;
    /**
     * The resource name of the egress-only internet gateway.
     *
     * @default - provisioned without a resource name
     */
    readonly egressOnlyInternetGatewayName?: string;
}
/**
 * Properties to define an internet gateway.
 */
export interface InternetGatewayProps {
    /**
     * The ID of the VPC for which to create the internet gateway.
     */
    readonly vpc: IVpcV2;
    /**
     * The resource name of the internet gateway.
     *
     * @default - provisioned without a resource name
     */
    readonly internetGatewayName?: string;
}
/**
 * Properties to define a VPN gateway.
 */
export interface VPNGatewayV2Props extends VPNGatewayV2Options, AwsConstructProps {
    /**
     * The ID of the VPC for which to create the VPN gateway.
     */
    readonly vpc: IVpcV2;
}
/**
 * Options to define a NAT gateway.
 */
export interface NatGatewayOptions {
    /**
     * The subnet in which the NAT gateway is located.
     */
    readonly subnet: ISubnetV2;
    /**
     * AllocationID of Elastic IP address that's associated with the NAT gateway. This property is required for a public NAT
     * gateway and cannot be specified with a private NAT gateway.
     *
     * @default - attr.allocationID of a new Elastic IP created by default
     * //TODO: ADD L2 for elastic ip
     */
    readonly allocationId?: string;
    /**
     * Indicates whether the NAT gateway supports public or private connectivity.
     *
     * @default NatConnectivityType.Public
     */
    readonly connectivityType?: NatConnectivityType;
    /**
     * The maximum amount of time to wait before forcibly releasing the
     * IP addresses if connections are still in progress.
     *
     * @default 350seconds
     */
    readonly maxDrainDuration?: Duration;
    /**
     * The private IPv4 address to assign to the NAT gateway.
     *
     * @default - If you don't provide an address, a private IPv4 address will be automatically assigned.
     */
    readonly privateIpAddress?: string;
    /**
     * Secondary EIP allocation IDs.
     * @see https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html#nat-gateway-creating
     *
     * @default - no secondary allocation IDs attached to NATGW
     *
     */
    readonly secondaryAllocationIds?: string[];
    /**
     * The number of secondary private IPv4 addresses you
     * want to assign to the NAT gateway.
     *
     * `SecondaryPrivateIpAddressCount` and `SecondaryPrivateIpAddresses` cannot be
     * set at the same time.
     * @see https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html#nat-gateway-creating
     *
     * @default - no secondary allocation IDs associated with NATGW
     */
    readonly secondaryPrivateIpAddressCount?: number;
    /**
     * Secondary private IPv4 addresses.
     *
     * `SecondaryPrivateIpAddressCount` and `SecondaryPrivateIpAddresses` cannot be
     * set at the same time.
     * @see https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html#nat-gateway-creating
     *
     * @default - no secondary private IpAddresses associated with NATGW
     */
    readonly secondaryPrivateIpAddresses?: string[];
    /**
     * The resource name of the NAT gateway.
     *
     * @default - NATGW provisioned without any name
     */
    readonly natGatewayName?: string;
}
/**
 * Properties to define a NAT gateway.
 */
export interface NatGatewayProps extends NatGatewayOptions, AwsConstructProps {
    /**
     * The ID of the VPC in which the NAT gateway is located.
     *
     * @default - no elastic ip associated, required in case of public connectivity if `AllocationId` is not defined
     */
    readonly vpc?: IVpcV2;
}
/**
 * Options to define a VPC peering connection.
 */
export interface VPCPeeringConnectionOptions {
    /**
     * The VPC that is accepting the peering connection.
     */
    readonly acceptorVpc: IVpcV2;
    /**
     * The resource name of the peering connection.
     *
     * @default - peering connection provisioned without any name
     */
    readonly vpcPeeringConnectionName?: string;
}
/**
 * Properties to define a VPC peering connection.
 */
export interface VPCPeeringConnectionProps extends VPCPeeringConnectionOptions {
    /**
     * The VPC that is requesting the peering connection.
     */
    readonly requestorVpc: IVpcV2;
}
/**
 * Creates an egress-only internet gateway
 * @resource aws_egress_only_internet_gateway
 */
export declare class EgressOnlyInternetGateway extends AwsConstructBase implements IRouteTarget {
    get routeTargetOutputs(): RouteTargetOutputs;
    get outputs(): Record<string, any>;
    /**
     * The type of router used in the route.
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     */
    readonly routerTargetId: string;
    /**
     * The egress-only internet gateway CFN resource.
     */
    readonly resource: tfEgressOnlyInternetGateway.EgressOnlyInternetGateway;
    constructor(scope: Construct, id: string, props: EgressOnlyInternetGatewayProps);
}
/**
 * Creates an internet gateway
 * @resource AWS::EC2::InternetGateway
 */
export declare class InternetGateway extends AwsConstructBase implements IRouteTarget {
    get routeTargetOutputs(): RouteTargetOutputs;
    get outputs(): Record<string, any>;
    /**
     * The type of router used in the route.
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     */
    readonly routerTargetId: string;
    /**
     * The ID of the VPC for which to create the internet gateway.
     */
    readonly vpcId: string;
    /**
     * The internet gateway CFN resource.
     */
    readonly resource: tfInternetGateway.InternetGateway;
    constructor(scope: Construct, id: string, props: InternetGatewayProps);
}
/**
 * Creates a virtual private gateway
 * @resource AWS::EC2::VPNGateway
 */
export declare class VPNGatewayV2 extends AwsConstructBase implements IRouteTarget {
    get routeTargetOutputs(): RouteTargetOutputs;
    get outputs(): Record<string, any>;
    /**
     * The type of router used in the route.
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     */
    readonly routerTargetId: string;
    /**
     * The ID of the VPC for which to create the VPN gateway.
     */
    readonly vpcId: string;
    /**
     * The VPN gateway CFN resource.
     */
    readonly resource: tfVpnGateway.VpnGateway;
    /**
     * The VPN Gateway Attachment
     */
    private readonly _attachment;
    /**
     * The VPN Gateway Route Propagation
     */
    private readonly _routePropagation;
    constructor(scope: Construct, id: string, props: VPNGatewayV2Props);
}
/**
 * Creates a network address translation (NAT) gateway
 * @resource AWS::EC2::NatGateway
 */
export declare class NatGateway extends AwsConstructBase implements IRouteTarget {
    get routeTargetOutputs(): RouteTargetOutputs;
    get outputs(): Record<string, any>;
    /**
     * Id of the NatGateway
     * @attribute
     */
    readonly natGatewayId: string;
    /**
     * The type of router used in the route.
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     */
    readonly routerTargetId: string;
    /**
     * Indicates whether the NAT gateway supports public or private connectivity.
     *
     * @default public
     */
    readonly connectivityType?: NatConnectivityType;
    /**
     * The maximum amount of time to wait before forcibly releasing the
     * IP addresses if connections are still in progress.
     *
     * @default '30 minutes'
     */
    readonly maxDrainDuration?: Duration;
    /**
     * The NAT gateway CFN resource.
     */
    readonly resource: tfNatGateway.NatGateway;
    constructor(scope: Construct, id: string, props: NatGatewayProps);
}
/**
 * Creates a peering connection between two VPCs
 * @resource AWS::EC2::VPCPeeringConnection
 */
export declare class VPCPeeringConnection extends AwsConstructBase implements IRouteTarget {
    get routeTargetOutputs(): RouteTargetOutputs;
    get outputs(): Record<string, any>;
    /**
     * The type of router used in the route.
     */
    readonly routerType: RouterType;
    /**
     * The ID of the route target.
     */
    readonly routerTargetId: string;
    /**
     * The VPC peering connection CFN resource.
     */
    readonly resource: tfVpcPeeringConnection.VpcPeeringConnection;
    constructor(scope: Construct, id: string, props: VPCPeeringConnectionProps);
    /**
     * Validates if the provided IPv4 CIDR block overlaps with existing subnet CIDR blocks within the given VPC.
     *
     * @param requestorVpc The VPC of the requestor.
     * @param acceptorVpc The VPC of the acceptor.
     * @returns True if the IPv4 CIDR block overlaps with each other for two VPCs, false otherwise.
     * @internal
     */
    private validateVpcCidrOverlap;
}
/**
 * The type of endpoint or gateway being targeted by the route.
 */
export interface RouteTargetProps {
    /**
     * The gateway route target. This is used for targets such as
     * egress-only internet gateway or VPC peering connection.
     *
     * @default - target is not set to a gateway, in this case an endpoint is needed.
     */
    readonly gateway?: IRouteTarget;
    /**
     * The endpoint route target. This is used for targets such as
     * VPC endpoints.
     *
     * @default - target is not set to an endpoint, in this case a gateway is needed.
     */
    readonly endpoint?: IVpcEndpoint;
}
/**
 * The gateway or endpoint targeted by the route.
 */
export declare class RouteTargetType {
    /**
     * The gateway route target. This is used for targets such as
     * egress-only internet gateway or VPC peering connection.
     *
     * @default - target is not set to a gateway, in this case an endpoint is needed.
     */
    readonly gateway?: IRouteTarget;
    /**
     * The endpoint route target. This is used for targets such as
     * VPC endpoints.
     *
     * @default - target is not set to an endpoint, in this case a gateway is needed.
     */
    readonly endpoint?: IVpcEndpoint;
    constructor(props: RouteTargetProps);
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface RouteOutputs {
    /**
     * The ID of the route table for the route.
     *
     * @attribute
     */
    readonly routeTable: string;
    /**
     * The IPv4 or IPv6 CIDR block used for the destination match.
     *
     * Routing decisions are based on the most specific match.
     *
     * @attribute
     */
    readonly destination: string;
    /**
     * The gateway or endpoint targeted by the route.
     *
     * @attribute
     */
    readonly target: RouteTargetOutputs | VpcEndpointOutputs;
}
/**
 * Interface to define a route.
 */
export interface IRouteV2 extends IAwsConstruct {
    /**
     * The outputs of the route.
     */
    readonly routeOutputs: RouteOutputs;
    /**
     * The ID of the route table for the route.
     * @attribute routeTable
     */
    readonly routeTable: IRouteTable;
    /**
     * The IPv4 or IPv6 CIDR block used for the destination match.
     *
     * Routing decisions are based on the most specific match.
     * TODO: Look for strong IP type implementation here.
     */
    readonly destination: string;
    /**
     * The gateway or endpoint targeted by the route.
     */
    readonly target: RouteTargetType;
}
/**
 * Properties to define a route.
 */
export interface RouteProps {
    /**
     * The ID of the route table for the route.
     *
     * @attribute routeTable
     */
    readonly routeTable: IRouteTable;
    /**
     * The IPv4 or IPv6 CIDR block used for the destination match.
     *
     * Routing decisions are based on the most specific match.
     */
    readonly destination: string;
    /**
     * The gateway or endpoint targeted by the route.
     */
    readonly target: RouteTargetType;
    /**
     * The resource name of the route.
     *
     * @default - provisioned without a route name
     */
    readonly routeName?: string;
}
/**
 * Creates a new route with added functionality.
 * @resource AWS::EC2::Route
 */
export declare class Route extends AwsConstructBase implements IRouteV2 {
    get routeOutputs(): RouteOutputs;
    get outputs(): Record<string, any>;
    /**
     * The IPv4 or IPv6 CIDR block used for the destination match.
     *
     * Routing decisions are based on the most specific match.
     */
    readonly destination: string;
    /**
     * The gateway or endpoint targeted by the route.
     */
    readonly target: RouteTargetType;
    /**
     * The route table for the route.
     * @attribute routeTable
     */
    readonly routeTable: IRouteTable;
    /**
     * The type of router the route is targeting
     */
    readonly targetRouterType: RouterType;
    /**
     * The route CFN resource.
     */
    readonly resource?: tfRoute.Route;
    /**
     * Destination cidr block for ipv6
     */
    private destinationIpv6Cidr?;
    /**
     * Destination cidr block for ipv4
     */
    private destinationIpv4Cidr?;
    constructor(scope: Construct, id: string, props: RouteProps);
}
/**
 * Properties to define a route table.
 */
export interface RouteTableProps {
    /**
     * The ID of the VPC.
     */
    readonly vpc: IVpcV2;
    /**
     * The resource name of the route table.
     *
     * @default - provisioned without a route table name
     */
    readonly routeTableName?: string;
}
/**
 * Creates a route table for the specified VPC
 * @resource aws_route_table
 */
export declare class RouteTable extends AwsConstructBase implements IRouteTable {
    get routeTableOutputs(): RouteTableOutputs;
    get outputs(): Record<string, any>;
    /**
     * The ID of the route table.
     */
    readonly routeTableId: string;
    /**
     * The route table CFN resource.
     */
    readonly resource: tfRouteTable.RouteTable;
    constructor(scope: Construct, id: string, props: RouteTableProps);
    /**
     * Adds a new custom route to the route table.
     *
     * @param destination The IPv4 or IPv6 CIDR block used for the destination match.
     * @param target The gateway or endpoint targeted by the route.
     * @param routeName The resource name of the route.
     */
    addRoute(id: string, destination: string, target: RouteTargetType, routeName?: string): void;
}

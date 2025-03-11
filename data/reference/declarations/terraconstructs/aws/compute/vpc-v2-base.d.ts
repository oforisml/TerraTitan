import { IDependable, DependencyGroup } from "constructs";
import { AwsConstructBase } from "../aws-construct";
import { ClientVpnEndpointOptions, ClientVpnEndpoint } from "./client-vpn-endpoint";
import { NatGateway, NatGatewayOptions, VPCPeeringConnection, VPCPeeringConnectionOptions, VPNGatewayV2 } from "./route";
import { VpcOutputs, IVpc, ISubnet, SubnetSelection, SelectedSubnets } from "./vpc";
import { InterfaceVpcEndpointOptions, InterfaceVpcEndpoint, GatewayVpcEndpointOptions, GatewayVpcEndpoint } from "./vpc-endpoint";
import { FlowLogOptions, FlowLog } from "./vpc-flow-logs";
import { EnableVpnGatewayOptions, VpnConnection, VpnConnectionOptions, VpnConnectionType } from "./vpn";
import { Role } from "../iam";
import { IVPCCidrBlock } from "./vpc-v2";
/**
 * Options to define EgressOnlyInternetGateway for VPC
 */
export interface EgressOnlyInternetGatewayOptions {
    /**
     * List of subnets where route to EGW will be added
     *
     * @default - no route created
     */
    readonly subnets?: SubnetSelection[];
    /**
     * Destination Ipv6 address for EGW route
     *
     * @default - '::/0' all Ipv6 traffic
     */
    readonly destination?: string;
    /**
     * The resource name of the egress-only internet gateway.
     * Provided name will be used for tagging
     *
     * @default - no name tag associated and provisioned without a resource name
     */
    readonly egressOnlyInternetGatewayName?: string;
}
/**
 * Options to define InternetGateway for VPC
 */
export interface InternetGatewayOptions {
    /**
     * Destination Ipv6 address for EGW route
     *
     * @default - '0.0.0.0' all Ipv4 traffic
     */
    readonly ipv4Destination?: string;
    /**
     * Destination Ipv6 address for EGW route
     *
     * @default - '::/0' all Ipv6 traffic
     */
    readonly ipv6Destination?: string;
    /**
     * The resource name of the internet gateway.
     * Provided name will be used for tagging
     *
     * @default - provisioned without a resource name
     */
    readonly internetGatewayName?: string;
}
/**
 * Options to define VPNGatewayV2 for VPC
 */
export interface VPNGatewayV2Options {
    /**
     * The type of VPN connection the virtual private gateway supports.
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpngateway.html#cfn-ec2-vpngateway-type
     */
    readonly type: VpnConnectionType;
    /**
     * The private Autonomous System Number (ASN) for the Amazon side of a BGP session.
     *
     * @default - no ASN set for BGP session
     */
    readonly amazonSideAsn?: number;
    /**
     * The resource name of the VPN gateway.
     *
     * @default - resource provisioned without any name
     */
    readonly vpnGatewayName?: string;
    /**
     * Subnets where the route propagation should be added.
     *
     * @default - no propogation for routes
     */
    readonly vpnRoutePropagation?: SubnetSelection[];
}
/**
 * Placeholder to see what extra props we might need,
 * will be added to original IVPC
 */
export interface IVpcV2 extends IVpc {
    /**
     * The secondary CIDR blocks associated with the VPC.
     *
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-resize}.
     */
    readonly secondaryCidrBlock?: IVPCCidrBlock[];
    /**
     * The primary IPv4 CIDR block associated with the VPC.
     * Needed in order to validate the vpc range of subnet
     * current prop vpcCidrBlock refers to the token value
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-sizing-ipv4}.
     */
    readonly ipv4CidrBlock: string;
    /**
     * Optional to override inferred region
     *
     * @default - current stack's environment region
     */
    readonly region: string;
    /**
     * The ID of the AWS account that owns the VPC
     *
     * @default - the account id of the parent stack
     */
    readonly ownerAccountId: string;
    /**
     * IPv4 CIDR provisioned under pool
     * Required to check for overlapping CIDRs after provisioning
     * is complete under IPAM pool
     */
    readonly ipv4IpamProvisionedCidrs?: string[];
    /**
     * VpcName to be used for tagging its components
     * @attribute
     */
    readonly vpcName?: string;
    /**
     * Add an Egress only Internet Gateway to current VPC.
     * Can only be used for ipv6 enabled VPCs.
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/userguide/egress-only-internet-gateway-basics.html}.
     */
    addEgressOnlyInternetGateway(options?: EgressOnlyInternetGatewayOptions): void;
    /**
     * Adds an Internet Gateway to current VPC.
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/userguide/vpc-igw-internet-access.html}.
     *
     * @default - defines route for all ipv4('0.0.0.0') and ipv6 addresses('::/0')
     */
    addInternetGateway(options?: InternetGatewayOptions): void;
    /**
     * Adds VPN Gateway to VPC and set route propogation.
     * For more information, see the {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpngateway.html}.
     *
     * @default - no route propogation
     */
    enableVpnGatewayV2(options: VPNGatewayV2Options): VPNGatewayV2;
    /**
     * Adds a new NAT Gateway to VPC
     * A NAT gateway is a Network Address Translation (NAT) service. NAT Gateway Connectivity can be of type `Public` or `Private`.
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html}.
     *
     * @default ConnectivityType.Public
     */
    addNatGateway(options: NatGatewayOptions): NatGateway;
    /**
     * Adds a new role to acceptor VPC account
     * A cross account role is required for the VPC to peer with another account.
     * For more information, see the {@link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/peer-with-vpc-in-another-account.html}.
     */
    createAcceptorVpcRole(requestorAccountId: string): Role;
    /**
     * Creates a new peering connection
     * A peering connection is a private virtual network established between two VPCs.
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html}.
     */
    createPeeringConnection(id: string, options: VPCPeeringConnectionOptions): VPCPeeringConnection;
}
/**
 * Base class for creating a VPC (Virtual Private Cloud) in AWS.
 *
 * For more information, see the {@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2.Vpc.html|AWS CDK Documentation on VPCs}.
 */
export declare abstract class VpcV2Base extends AwsConstructBase implements IVpcV2 {
    /**
     * Identifier for this VPC
     */
    abstract readonly vpcId: string;
    /**
     * Arn of this VPC
     */
    abstract readonly vpcArn: string;
    /**
     * CIDR range for this VPC
     */
    abstract readonly vpcCidrBlock: string;
    /**
     * List of public subnets in this VPC
     */
    readonly publicSubnets: ISubnet[];
    /**
     * List of private subnets in this VPC
     */
    readonly privateSubnets: ISubnet[];
    /**
     * List of isolated subnets in this VPC
     */
    abstract readonly isolatedSubnets: ISubnet[];
    /**
     * AZs for this VPC
     */
    readonly availabilityZones: string[];
    /**
     * Dependable that can be depended upon to force internet connectivity established on the VPC
     */
    abstract readonly internetConnectivityEstablished: IDependable;
    /**
     * Dependable that can be depended upon to force internet connectivity established on the VPC
     * Add igw to this if its a public subnet
     * @internal
     */
    protected readonly _internetConnectivityEstablished: DependencyGroup;
    /**
     * Secondary IPs for the VPC, can be multiple Ipv4 or Ipv6
     * Ipv4 should be within RFC#1918 range
     */
    abstract readonly secondaryCidrBlock?: IVPCCidrBlock[];
    /**
     * The primary IPv4 CIDR block associated with the VPC.
     * Needed in order to validate the vpc range of subnet
     * current prop vpcCidrBlock refers to the token value
     * For more information, see the {@link https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html#vpc-sizing-ipv4}.
     */
    abstract readonly ipv4CidrBlock: string;
    /**
     * VpcName to be used for tagging its components
     */
    abstract readonly vpcName?: string;
    /**
     * Region for this VPC
     */
    abstract readonly region: string;
    /**
     * Identifier of the owner for this VPC
     */
    abstract readonly ownerAccountId: string;
    /**
     * IPv4 CIDR provisioned under pool
     * Required to check for overlapping CIDRs after provisioning
     * is complete under IPAM pool
     */
    abstract readonly ipv4IpamProvisionedCidrs?: string[];
    get vpcOutputs(): VpcOutputs;
    get outputs(): Record<string, any>;
    /**
     * If this is set to true, don't error out on trying to select subnets
     */
    protected incompleteSubnetDefinition: boolean;
    /**
     * Mutable private field for the vpnGatewayId
     * @internal
     */
    protected _vpnGatewayId?: string;
    /**
     * Mutable private field for the internetGatewayId
     * @internal
     */
    protected _internetGatewayId: string;
    /**
     * Return information on the subnets appropriate for the given selection strategy
     *
     * Requires that at least one subnet is matched, throws a descriptive
     * error message otherwise.
     */
    selectSubnets(selection?: SubnetSelection): SelectedSubnets;
    /**
     * Adds a VPN Gateway to this VPC
     * @deprecated use enableVpnGatewayV2 for compatibility with VPCV2.Route
     */
    enableVpnGateway(options: EnableVpnGatewayOptions): void;
    /**
     * Adds VPNGAtewayV2 to this VPC
     */
    enableVpnGatewayV2(options: VPNGatewayV2Options): VPNGatewayV2;
    /**
     * Adds a new VPN connection to this VPC
     */
    addVpnConnection(id: string, options: VpnConnectionOptions): VpnConnection;
    /**
     * Adds a new client VPN endpoint to this VPC
     */
    addClientVpnEndpoint(id: string, options: ClientVpnEndpointOptions): ClientVpnEndpoint;
    /**
     * Adds a new interface endpoint to this VPC
     */
    addInterfaceEndpoint(id: string, options: InterfaceVpcEndpointOptions): InterfaceVpcEndpoint;
    /**
     * Adds a new gateway endpoint to this VPC
     */
    addGatewayEndpoint(id: string, options: GatewayVpcEndpointOptions): GatewayVpcEndpoint;
    /**
     * Adds a new Egress Only Internet Gateway to this VPC and defines a new route
     * to the route table of given subnets.
     *
     * @default - in case of no input subnets, no route is created
     */
    addEgressOnlyInternetGateway(options?: EgressOnlyInternetGatewayOptions): void;
    /**
     * Creates a route for EGW with destination set to outbound IPv6('::/0') or custom ipv6 address.
     * @internal
     */
    private createEgressRoute;
    /**
     * Adds a new Internet Gateway to this VPC
     *
     * @default - creates a new route for public subnets(with all outbound access) to the Internet Gateway.
     */
    addInternetGateway(options?: InternetGatewayOptions): void;
    /**
     * Adds default route for the internet gateway
     * @internal
     */
    private addDefaultInternetRoute;
    /**
     * Adds a new NAT Gateway to the given subnet of this VPC
     * of given subnets.
     */
    addNatGateway(options: NatGatewayOptions): NatGateway;
    /**
     * Adds a new flow log to this VPC
     */
    addFlowLog(id: string, options?: FlowLogOptions): FlowLog;
    /**
     * Creates peering connection role for acceptor VPC
     */
    createAcceptorVpcRole(requestorAccountId: string): Role;
    /**
     * Creates a peering connection
     */
    createPeeringConnection(id: string, options: VPCPeeringConnectionOptions): VPCPeeringConnection;
    /**
     * Returns the id of the VPN Gateway (if enabled)
     */
    get vpnGatewayId(): string | undefined;
    /**
     * Returns the id of the Internet Gateway (if enabled)
     */
    get internetGatewayId(): string | undefined;
    /**
     * Return the subnets appropriate for the placement strategy
     */
    protected selectSubnetObjects(selection?: SubnetSelection): ISubnet[];
    private applySubnetFilters;
    private selectSubnetObjectsByName;
    private selectSubnetObjectsByType;
    /**
     * Validate the fields in a SubnetSelection object, and reify defaults if necessary
     *
     * In case of default selection, select the first type of PRIVATE, ISOLATED,
     * PUBLIC (in that order) that has any subnets.
     */
    private reifySelectionDefaults;
}

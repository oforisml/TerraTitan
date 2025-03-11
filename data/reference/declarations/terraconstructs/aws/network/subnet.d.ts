import { vpc, subnet, natGateway, routeTable } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps, IAwsConstruct } from "../aws-construct";
export declare enum SubnetType {
    PUBLIC = "PUBLIC",
    PRIVATE = "PRIVATE",
    DATA = "DATA"
}
export interface BaseSubnetProps extends AwsConstructProps {
    /**
     * The VPC to create the subnet into
     */
    readonly vpc: vpc.Vpc;
    /**
     * The IPv4 CIDR block for the subnet.
     */
    readonly ipv4CidrBlock: string;
    /**
     * The availability zone for the subnet.
     */
    readonly availabilityZone: string;
    /**
     * Additional tags for the subnet.
     *
     * @default - No additional tags
     */
    readonly tags?: Record<string, string>;
}
export interface ISubnet extends IAwsConstruct {
    /**
     * The VPC ID of the subnet.
     */
    readonly vpcId: string;
    /**
     * The IPv4 CIDR block for the subnet.
     */
    readonly ipv4CidrBlock: string;
    /**
     * The availability zone for the subnet.
     */
    readonly availabilityZone: string;
    /**
     * The subnet ID of the subnet.
     */
    readonly subnetId: string;
}
export declare abstract class BaseSubnet extends AwsConstructBase implements ISubnet {
    private readonly type;
    private readonly _availabilityZone;
    get availabilityZone(): string;
    private readonly _subnetId;
    get subnetId(): string;
    protected readonly vpc: vpc.Vpc;
    get vpcId(): string;
    protected readonly cidr: string;
    get ipv4CidrBlock(): string;
    get outputs(): Record<string, any>;
    readonly resource: subnet.Subnet;
    constructor(scope: Construct, id: string, type: SubnetType, props: BaseSubnetProps);
}
export interface PublicSubnetProps extends BaseSubnetProps {
    /**
     * Whether to create a NAT gateway in the subnet.
     */
    readonly createNatGateway?: boolean;
    /**
     * The EIP allocation ID to use for the NAT gateway.
     *
     * @default - A new EIP is created
     */
    readonly eipAllocationId?: string;
    /**
     * The Route Table ID to associate with the subnet.
     */
    readonly defaultRouteTableId: string;
}
export declare class PublicSubnet extends BaseSubnet {
    private readonly natGateway?;
    private readonly eip?;
    constructor(scope: Construct, id: string, props: PublicSubnetProps);
    get natgateway(): natGateway.NatGateway | undefined;
}
export interface PrivateSubnetProps extends BaseSubnetProps {
    readonly routeTable: routeTable.RouteTable;
}
export declare class PrivateSubnet extends BaseSubnet {
    private readonly routeTable;
    constructor(scope: Construct, id: string, props: PrivateSubnetProps);
    get routeTableId(): string;
}
export declare class DataSubnet extends BaseSubnet {
    private readonly routeTable;
    constructor(scope: Construct, id: string, props: PrivateSubnetProps);
    get routeTableId(): string;
}

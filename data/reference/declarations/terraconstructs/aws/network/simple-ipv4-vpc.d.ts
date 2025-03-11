import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { INetwork, NetworkOutputs } from "./network";
import { ISubnet } from "./subnet";
import { ISubnetGroup } from "./subnet-group";
export declare enum NatGatewayOption {
    SINGLE_NAT_GATEWAY = "single-nat-gateway",
    NAT_PER_AVAILABILITY_ZONE = "nat-per-availability-zone"
}
export interface SimpleIPv4Props extends AwsConstructProps {
    /**
     * The number of availability zones to use.
     *
     * @default 2
     */
    readonly azCount?: number;
    /**
     * The IPv4 CIDR block for the VPC.
     */
    readonly ipv4CidrBlock: string;
    /**
     * The NAT Gateway set up.
     *
     * @default NatGatewayOption.NAT_PER_AVAILABILITY_ZONE
     */
    readonly natGatewayOption?: NatGatewayOption;
    /**
     * Provisions a Service Discovery Private DNS Namespace resource.
     */
    readonly internalDomain: string;
}
/**
 * Define an AWS Virtual Private Cloud simple IPv4 network.
 *
 * See the package-level documentation of this package for an overview
 * of the various dimensions in which you can configure your VPC.
 *
 * For example:
 *
 * ```ts
 * const network = new network.SimpleIPv4(awsStack, "network", {
 *  ipv4CidrBlock: "10.0.0.0/16",
 *  internalDomain: "example.local",
 * });
 *
 * // Add a subnet group for RDS
 * network.enableDbSubnetGroup();
 * ```
 *
 * @resource aws_vpc
 * @beacon-class network.SimpleIPv4Vpc
 */
export declare class SimpleIPv4Vpc extends AwsConstructBase implements INetwork {
    private readonly _props;
    private readonly _outputs;
    get networkOutputs(): NetworkOutputs;
    get outputs(): Record<string, any>;
    private readonly ipv4CidrBlock;
    private readonly natGatewayOption;
    private readonly natGateways;
    private readonly privateRouteTables;
    private readonly azCount;
    private readonly availabilityZones;
    private readonly vpc;
    get vpcId(): string;
    private readonly _publicSubnets;
    get publicSubnets(): ISubnet[];
    private readonly _privateSubnets;
    get privateSubnets(): ISubnet[];
    private readonly _dataSubnets;
    get dataSubnets(): ISubnet[];
    private _dbSubnetGroup?;
    get dbSubnetGroup(): ISubnetGroup | undefined;
    private _elastiCacheSubnetGroup?;
    get elastiCacheSubnetGroup(): ISubnetGroup | undefined;
    private readonly serviceDiscoveryNamespace;
    get serviceDiscoveryNamespaceArn(): string;
    constructor(scope: Construct, id: string, props: SimpleIPv4Props);
    enableDbSubnetGroup(): void;
    enableElastiCacheSubnetGroup(): void;
    private createPublicSubnets;
    private createPrivateSubnets;
    private createDataSubnets;
}

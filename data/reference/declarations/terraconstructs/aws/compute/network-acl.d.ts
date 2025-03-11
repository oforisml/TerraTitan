import { networkAclRule as tfNetworkAclRule } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AclCidr, AclTraffic } from "./network-acl-types";
import { ISubnet, IVpc, SubnetSelection } from "./vpc";
import { IAwsConstruct, AwsConstructBase, AwsConstructProps } from "../aws-construct";
export interface NetworkAclOutputs {
    /**
     * The ID of the NetworkACL
     */
    readonly networkAclId: string;
}
/**
 * A NetworkAcl
 *
 *
 */
export interface INetworkAcl extends IAwsConstruct {
    readonly networkAclOutputs: NetworkAclOutputs;
    /**
     * ID for the current Network ACL
     * @attribute
     */
    readonly networkAclId: string;
    /**
     * Add a new entry to the ACL
     */
    addEntry(id: string, options: CommonNetworkAclEntryOptions): NetworkAclEntry;
}
/**
 * A NetworkAclBase that is not created in this template
 *
 *
 */
declare abstract class NetworkAclBase extends AwsConstructBase implements INetworkAcl {
    get networkAclOutputs(): NetworkAclOutputs;
    get outputs(): Record<string, any>;
    abstract readonly networkAclId: string;
    /**
     * Add a new entry to the ACL
     */
    addEntry(id: string, options: CommonNetworkAclEntryOptions): NetworkAclEntry;
}
/**
 * Properties to create NetworkAcl
 *
 *
 */
export interface NetworkAclProps {
    /**
     * The name of the NetworkAcl.
     *
     * Since the NetworkAcl resource doesn't support providing a physical name, the value provided here will be recorded in the `Name` tag.
     *
     * @default CDK generated name
     */
    readonly networkAclName?: string;
    /**
     * The VPC in which to create the NetworkACL.
     */
    readonly vpc: IVpc;
    /**
     * Subnets in the given VPC to associate the ACL with
     *
     * More subnets can always be added later by calling
     * `associateWithSubnets()`.
     *
     * @default - No subnets associated
     */
    readonly subnetSelection?: SubnetSelection;
}
/**
 * Define a new custom network ACL
 *
 * By default, will deny all inbound and outbound traffic unless entries are
 * added explicitly allowing it.
 *
 *
 */
export declare class NetworkAcl extends NetworkAclBase {
    /**
     * Import an existing NetworkAcl into this app.
     */
    static fromNetworkAclId(scope: Construct, id: string, networkAclId: string): INetworkAcl;
    /**
     * The ID of the NetworkACL
     *
     * @attribute
     */
    readonly networkAclId: string;
    /**
     * The VPC ID for this NetworkACL
     *
     * @attribute
     */
    readonly networkAclVpcId: string;
    private readonly networkAcl;
    private readonly vpc;
    constructor(scope: Construct, id: string, props: NetworkAclProps);
    /**
     * Associate the ACL with a given set of subnets
     */
    associateWithSubnet(id: string, selection: SubnetSelection): void;
}
/**
 * What action to apply to traffic matching the ACL
 *
 *
 */
export declare enum Action {
    /**
     * Allow the traffic
     */
    ALLOW = "allow",
    /**
     * Deny the traffic
     */
    DENY = "deny"
}
export interface NetworkAclEntryOutputs {
    /**
     * The ID of the NetworkACL
     */
    readonly networkAclId: string;
}
/**
 * A NetworkAclEntry
 *
 *
 */
export interface INetworkAclEntry extends IAwsConstruct {
    readonly networkAclEntryOutputs: NetworkAclEntryOutputs;
    /**
     * The network ACL.
     */
    readonly networkAcl: INetworkAcl;
}
/**
 * Base class for NetworkAclEntries
 *
 *
 */
declare abstract class NetworkAclEntryBase extends AwsConstructBase implements INetworkAclEntry {
    get networkAclEntryOutputs(): NetworkAclEntryOutputs;
    get outputs(): Record<string, any>;
    abstract readonly networkAcl: INetworkAcl;
}
/**
 * Direction of traffic the AclEntry applies to
 *
 *
 */
export declare enum TrafficDirection {
    /**
     * Traffic leaving the subnet
     */
    EGRESS = 0,
    /**
     * Traffic entering the subnet
     */
    INGRESS = 1
}
/**
 * Basic NetworkACL entry props
 *
 *
 */
export interface CommonNetworkAclEntryOptions {
    /**
     * The CIDR range to allow or deny.
     */
    readonly cidr: AclCidr;
    /**
     * What kind of traffic this ACL rule applies to
     */
    readonly traffic: AclTraffic;
    /**
     * Traffic direction, with respect to the subnet, this rule applies to
     *
     * @default TrafficDirection.INGRESS
     */
    readonly direction?: TrafficDirection;
    /**
     * Whether to allow or deny traffic that matches the rule; valid values are "allow" or "deny".
     *
     * Any traffic that is not explicitly allowed is automatically denied in a custom
     * ACL, all traffic is automatically allowed in a default ACL.
     *
     * @default ALLOW
     */
    readonly ruleAction?: Action;
    /**
     * Rule number to assign to the entry, such as 100. ACL entries are processed in ascending order by rule number.
     * Entries can't use the same rule number unless one is an egress rule and the other is an ingress rule.
     */
    readonly ruleNumber: number;
}
/**
 * Properties to create NetworkAclEntry
 *
 *
 */
export interface NetworkAclEntryProps extends CommonNetworkAclEntryOptions, AwsConstructProps {
    /**
     * The network ACL this entry applies to.
     */
    readonly networkAcl: INetworkAcl;
}
/**
 * Define an entry in a Network ACL table
 *
 *
 */
export declare class NetworkAclEntry extends NetworkAclEntryBase {
    readonly networkAcl: INetworkAcl;
    resource: tfNetworkAclRule.NetworkAclRule;
    constructor(scope: Construct, id: string, props: NetworkAclEntryProps);
}
export interface SubnetNetworkAclAssociationOutputs {
    /**
     * The ID of the SubnetNetworkAclAssociation
     */
    readonly subnetNetworkAclAssociationAssociationId: string;
}
/**
 * A SubnetNetworkAclAssociation
 *
 *
 */
export interface ISubnetNetworkAclAssociation extends IAwsConstruct {
    readonly subnetNetworkAclAssociationOutputs: SubnetNetworkAclAssociationOutputs;
    /**
     * ID for the current SubnetNetworkAclAssociation
     * @attribute
     */
    readonly subnetNetworkAclAssociationAssociationId: string;
}
/**
 * Properties to create a SubnetNetworkAclAssociation
 *
 *
 */
export interface SubnetNetworkAclAssociationProps extends AwsConstructProps {
    /**
     * The Network ACL this association is defined for
     *
     * @attribute
     */
    readonly networkAcl: INetworkAcl;
    /**
     * ID of the Subnet
     * @attribute
     */
    readonly subnet: ISubnet;
}
/**
 * Associate a network ACL with a subnet
 *
 *
 */
declare abstract class SubnetNetworkAclAssociationBase extends AwsConstructBase implements ISubnetNetworkAclAssociation {
    get subnetNetworkAclAssociationOutputs(): SubnetNetworkAclAssociationOutputs;
    get outputs(): Record<string, any>;
    abstract readonly subnetNetworkAclAssociationAssociationId: string;
}
export declare class SubnetNetworkAclAssociation extends SubnetNetworkAclAssociationBase {
    static fromSubnetNetworkAclAssociationAssociationId(scope: Construct, id: string, subnetNetworkAclAssociationAssociationId: string): ISubnetNetworkAclAssociation;
    /**
     * ID for the current SubnetNetworkAclAssociation
     * @attribute
     */
    readonly subnetNetworkAclAssociationAssociationId: string;
    /**
     * ID for the current Network ACL
     * @attribute
     */
    readonly networkAcl: INetworkAcl;
    /**
     * ID of the Subnet
     * @attribute
     */
    readonly subnet: ISubnet;
    private association;
    constructor(scope: Construct, id: string, props: SubnetNetworkAclAssociationProps);
}
export {};

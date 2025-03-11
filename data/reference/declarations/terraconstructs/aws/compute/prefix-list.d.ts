import { ec2ManagedPrefixList } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { IAwsConstruct, AwsConstructBase, AwsConstructProps } from "../aws-construct";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface PrefixListOutputs {
    /**
     * The ID of the prefix list
     *
     * @attribute
     */
    readonly prefixListId: string;
}
/**
 * A prefix list
 */
export interface IPrefixList extends IAwsConstruct {
    /** strongly typed outputs */
    readonly prefixListOutputs: PrefixListOutputs;
    /**
     * The ID of the prefix list
     *
     * @attribute
     */
    readonly prefixListId: string;
}
/**
 * The IP address type.
 */
export declare enum AddressFamily {
    IP_V4 = "IPv4",
    IP_V6 = "IPv6"
}
/**
 * Options to add a prefix list
 */
export interface PrefixListOptions {
    /**
     * The maximum number of entries for the prefix list.
     *
     * @default Automatically-calculated
     */
    readonly maxEntries?: number;
}
/**
 * Properties for creating a prefix list.
 */
export interface PrefixListProps extends PrefixListOptions, AwsConstructProps {
    /**
     * The address family of the prefix list.
     *
     * @default AddressFamily.IP_V4
     */
    readonly addressFamily?: AddressFamily;
    /**
     * The name of the prefix list.
     *
     * @default None
     *
     * @remarks
     * It is not recommended to use an explicit name.
     */
    readonly prefixListName?: string;
    /**
     * The list of entries for the prefix list.
     *
     * @default []
     */
    readonly entries?: ec2ManagedPrefixList.Ec2ManagedPrefixListEntry[];
}
/**
 * The base class for a prefix list
 */
declare abstract class PrefixListBase extends AwsConstructBase implements IPrefixList {
    get prefixListOutputs(): PrefixListOutputs;
    get outputs(): Record<string, any>;
    /**
     * The ID of the prefix list
     *
     * @attribute
     */
    abstract readonly prefixListId: string;
}
/**
 * A managed prefix list.
 * @resource AWS::EC2::PrefixList
 */
export declare class PrefixList extends PrefixListBase {
    /**
     * Look up prefix list by id.
     *
     */
    static fromPrefixListId(scope: Construct, id: string, prefixListId: string): IPrefixList;
    /**
     * The ID of the prefix list
     *
     * @attribute
     */
    readonly prefixListId: string;
    /**
     * The name of the prefix list
     *
     * @attribute
     */
    readonly prefixListName: string;
    /**
     * The ARN of the prefix list
     *
     * @attribute
     */
    readonly prefixListArn: string;
    /**
     * The owner ID of the prefix list
     *
     */
    readonly ownerId: string;
    /**
     * The version of the prefix list
     *
     */
    readonly version: number;
    /**
     * The address family of the prefix list
     *
     */
    readonly addressFamily: string;
    readonly resource: ec2ManagedPrefixList.Ec2ManagedPrefixList;
    constructor(scope: Construct, id: string, props?: PrefixListProps);
}
export {};

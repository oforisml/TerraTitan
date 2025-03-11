import { dbSubnetGroup, elasticacheSubnetGroup } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps, IAwsConstruct } from "../aws-construct";
import { ISubnet } from "./subnet";
export declare enum SubnetGroupType {
    /**
     * RDS and DocDb SubnetGroup
     */
    DB = "DB",
    /**
     * ElastiCache SubnetGroup
     */
    ELASTICACHE = "ELASTICACHE"
}
export interface SubnetGroupProps extends AwsConstructProps {
    readonly subnets: ISubnet[];
    readonly tags?: Record<string, string>;
}
export interface ISubnetGroup extends IAwsConstruct {
    readonly type: SubnetGroupType;
    readonly arn: string;
    readonly subnets: ISubnet[];
}
export declare abstract class BaseSubnetGroup extends AwsConstructBase implements ISubnetGroup {
    readonly type: SubnetGroupType;
    readonly tags?: Record<string, string>;
    private readonly _subnets;
    get subnets(): ISubnet[];
    abstract get arn(): string;
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, type: SubnetGroupType, props: SubnetGroupProps);
}
export declare class DbSubnetGroup extends BaseSubnetGroup {
    readonly resource: dbSubnetGroup.DbSubnetGroup;
    get arn(): string;
    constructor(scope: Construct, id: string, props: SubnetGroupProps);
}
export declare class ElastiCacheSubnetGroup extends BaseSubnetGroup {
    readonly resource: elasticacheSubnetGroup.ElasticacheSubnetGroup;
    get arn(): string;
    constructor(scope: Construct, id: string, props: SubnetGroupProps);
}

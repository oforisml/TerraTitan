import { route53Record } from "@cdktf/provider-aws";
import { IRecordSet, IDnsZone, IDistribution } from ".";
import { IBucket } from "../storage";
/**
 * Classes that are valid alias record targets, like CloudFront distributions and load
 * balancers, should implement this interface.
 */
export interface IAliasRecordTarget {
    /**
     * Return hosted zone ID and DNS name, usable for Route53 alias targets
     */
    bind(record: IRecordSet, zone?: IDnsZone): route53Record.Route53RecordAlias;
}
/**
 * Use a CloudFront Distribution as an alias record target
 */
export declare class DistributionTarget implements IAliasRecordTarget {
    private readonly distribution;
    constructor(distribution: IDistribution);
    bind(_record: IRecordSet, _zone?: IDnsZone): route53Record.Route53RecordAlias;
}
/**
 * Use Bucket as an alias record target
 */
export declare class BucketWebsiteTarget implements IAliasRecordTarget {
    private readonly bucket;
    constructor(bucket: IBucket);
    bind(_record: IRecordSet, _zone?: IDnsZone): route53Record.Route53RecordAlias;
}

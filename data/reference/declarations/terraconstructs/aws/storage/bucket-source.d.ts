import { s3Object } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { IBucket, AddSourceOptions } from ".";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
export interface BucketSourceProps extends AddSourceOptions, AwsConstructProps {
    /**
     * Target bucket to upload to
     */
    readonly bucket: IBucket;
}
export interface BucketObjectOutput {
    /**
     * The object source Hash
     */
    readonly sourceHash: string;
}
export interface BucketSourceOutputs {
    /**
     * The objects uploaded to the bucket indexed by key
     */
    readonly objects: Record<string, BucketObjectOutput>;
}
export interface IBucketSource extends IAwsConstruct {
    readonly bucketSourceOutputs: BucketSourceOutputs;
}
/**
 * A Bucket Source which reads files from disk and creates uploads to s3.
 */
export declare class BucketSource extends AwsConstructBase implements IBucketSource {
    readonly objects: s3Object.S3Object[];
    private readonly _bucketSourceOutputs;
    get bucketSourceOutputs(): BucketSourceOutputs;
    get outputs(): Record<string, any>;
    private readonly dependsOn;
    private readonly resolvedPath;
    private readonly prefix;
    private _bucket;
    constructor(scope: Construct, id: string, props: BucketSourceProps);
    private uploadAssetDir;
    private uploadAssetFile;
}

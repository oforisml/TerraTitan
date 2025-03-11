import { Construct } from "constructs";
import { IAwsConstruct, AwsConstructBase, AwsConstructProps } from "../../aws-construct";
import { IBucket } from "../../storage";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface TrustStoreOutputs {
    /**
     * The name of the trust store
     * @attribute
     */
    readonly trustStoreName: string;
    /**
     * The ARN of the trust store
     * @attribute
     */
    readonly trustStoreArn: string;
}
/**
 * Represents a Trust Store
 */
export interface ITrustStore extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly trustStoreOutputs: TrustStoreOutputs;
    /**
     * The name of the trust store
     * @attribute
     */
    readonly trustStoreName: string;
    /**
     * The ARN of the trust store
     * @attribute
     */
    readonly trustStoreArn: string;
}
/**
 * Properties used for the Trust Store
 */
export interface TrustStoreProps extends AwsConstructProps {
    /**
     * The name of the trust store
     *
     * @default - Auto generated
     */
    readonly trustStoreName?: string;
    /**
     * The bucket that the trust store is hosted in
     */
    readonly bucket: IBucket;
    /**
     * The key in S3 to look at for the trust store
     */
    readonly key: string;
    /**
     * The version of the S3 object that contains your truststore.
     * To specify a version, you must have versioning enabled for the S3 bucket.
     *
     * @default - latest version
     */
    readonly version?: string;
}
/**
 * A new Trust Store
 */
export declare class TrustStore extends AwsConstructBase implements ITrustStore {
    /**
     * Import from ARN
     */
    static fromTrustStoreArn(scope: Construct, id: string, trustStoreArn: string): ITrustStore;
    get trustStoreOutputs(): TrustStoreOutputs;
    get outputs(): Record<string, any>;
    /**
     * The name of the trust store
     *
     * @attribute
     */
    readonly trustStoreName: string;
    /**
     * The ARN of the trust store
     *
     * @attribute
     */
    readonly trustStoreArn: string;
    private physicalName;
    constructor(scope: Construct, id: string, props: TrustStoreProps);
}

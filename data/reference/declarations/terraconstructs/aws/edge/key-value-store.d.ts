import { cloudfrontKeyValueStore, cloudfrontkeyvaluestoreKey } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
export interface IStoreData {
    /**
     * The method called when given StoreData is added
     * (for the first time) to a KeyValueStore.
     */
    render(keyValueStoreArn: string): cloudfrontkeyvaluestoreKey.CloudfrontkeyvaluestoreKeyConfig[];
}
/**
 * The initial data to set for the key value store.
 *
 * This is work around for lack of support for import_source
 * @link https://github.com/hashicorp/terraform-provider-aws/issues/36524
 */
export declare abstract class KeyValuePairs implements IStoreData {
    /**
     * Key Value pairs stored in a local file.
     *
     * The key-value pairs have the following limits:
     *
     * - File size – 5 MB
     * - Key size – 512 characters
     * - Value size – 1024 characters
     *
     * @link https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/kvs-with-functions-create-s3-kvp.html
     *
     * @param filePath the path to the local file
     */
    static fromPath(filePath: string): KeyValuePairs;
    /**
     * Key Value pairs inline with Construct props.
     *
     * @param data the contents of the KeyValueStore
     */
    static fromInline(data: Record<string, any>): KeyValuePairs;
    protected data: Record<string, any>;
    /**
     * Called internally by the KeyValueStore to render the store data.
     */
    render(keyValueStoreArn: string): cloudfrontkeyvaluestoreKey.CloudfrontkeyvaluestoreKeyConfig[];
}
/**
 * inline Key Value pairs.
 */
export declare class InlineKeyValuePairs extends KeyValuePairs {
    /**
     * @param data the contents of the KeyValueStore
     */
    constructor(data: Record<string, any>);
}
/**
 * Key Value pairs stored in a local file.
 */
export declare class FileKeyValuePairs extends KeyValuePairs {
    /**
     * @param filePath the path to the local file
     */
    constructor(filePath: string);
    private isRecordOfStringAny;
}
/**
 * The properties to create a Key Value Store.
 */
export interface KeyValueStoreProps extends AwsConstructProps {
    /**
     * The unique name of the Key Value Store.
     *
     * @default A generated name
     */
    readonly nameSuffix: string;
    /**
     * A comment for the Key Value Store
     *
     * @default No comment will be specified
     */
    readonly comment?: string;
    /**
     * The Key Value store data.
     *
     * This will populate the initial items in the Key Value Store. The
     * source data must be in a valid JSON format.
     *
     * The key-value pairs have the following limits:
     *
     * - File size – 5 MB
     * - Key size – 512 characters
     * - Value size – 1024 characters
     *
     * @default No data will be imported to the store
     */
    readonly data?: IStoreData;
}
/**
 * CloudFront Key Value Store outputs for a stack.
 */
export interface KeyValueStoreOutputs {
    /**
     * The ARN of the Key Value Store.
     *
     * @attribute
     */
    readonly arn: string;
    /**
     * The Unique ID of the Key Value Store.
     *
     * @attribute
     */
    readonly id: string;
}
/**
 * A CloudFront Key Value Store.
 */
export interface IKeyValueStore extends IAwsConstruct {
    /** Strongly typed outputs
     *
     * @attribute
     */
    readonly keyValueStoreOutputs: KeyValueStoreOutputs;
    /**
     * The ARN of the Key Value Store.
     *
     * @attribute
     */
    readonly arn: string;
    /**
     * The Unique ID of the Key Value Store.
     *
     * @attribute
     */
    readonly id: string;
    /**
     * The status of the Key Value Store.
     *
     * @attribute
     */
    readonly status: string;
}
/**
 * A CloudFront Key Value Store.
 *
 * You can store any of the following formats:
 *
 * - String
 * - Byte-encoded string
 * - JSON
 *
 * @link https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/kvs-with-functions.html
 *
 * @resource aws_cloudfront_key_value_store
 */
export declare class KeyValueStore extends AwsConstructBase implements IKeyValueStore {
    readonly resource: cloudfrontKeyValueStore.CloudfrontKeyValueStore;
    private readonly _outputs;
    get keyValueStoreOutputs(): KeyValueStoreOutputs;
    get outputs(): Record<string, any>;
    readonly arn: string;
    readonly id: string;
    readonly status: string;
    constructor(scope: Construct, id: string, props: KeyValueStoreProps);
}

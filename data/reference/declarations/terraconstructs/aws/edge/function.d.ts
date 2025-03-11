import { cloudfrontFunction } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { IKeyValueStore } from ".";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
/**
 * Represents the function's source code
 */
export declare abstract class FunctionCode {
    /**
     * Inline code for function
     * @returns code object with inline code.
     * @param code The actual function code
     */
    static fromInline(code: string): FunctionCode;
    /**
     * Code from external file for function
     * @returns code object with contents from file.
     * @param options the options for the external file
     */
    static fromFile(options: FileCodeOptions): FunctionCode;
    /**
     * renders the function code
     */
    abstract render(): string;
}
/**
 * Options when reading the function's code from an external file
 */
export interface FileCodeOptions {
    /**
     * The path of the file to read the code from
     */
    readonly filePath: string;
}
/**
 * Represents a CloudFront Function
 *
 * @resource aws_cloudfront_function
 */
export interface IFunction extends IAwsConstruct {
    /** Strongly typed outputs
     *
     * @attribute
     */
    readonly functionOutputs: FunctionOutputs;
    /**
     * The name of the function.
     * @attribute
     */
    readonly functionName: string;
    /**
     * The ARN of the function.
     * @attribute
     */
    readonly functionArn: string;
}
/**
 * Outputs of an existing CloudFront Function to import it
 */
export interface FunctionOutputs {
    /**
     * The name of the function.
     */
    readonly name: string;
    /**
     * The ARN of the function.
     */
    readonly arn: string;
    /**
     * The Runtime of the function.
     * @default FunctionRuntime.JS_1_0
     */
    readonly functionRuntime?: string;
}
/**
 * Properties for creating a CloudFront Function
 */
export interface FunctionProps extends AwsConstructProps {
    /**
     * A name to identify the function.
     */
    readonly nameSuffix: string;
    /**
     * A comment to describe the function.
     * @default - same as `functionName`
     */
    readonly comment?: string;
    /**
     * The source code of the function.
     */
    readonly code: FunctionCode;
    /**
     * The runtime environment for the function.
     * @default FunctionRuntime.JS_1_0 (unless `keyValueStore` is specified, then `FunctionRuntime.JS_2_0`)
     */
    readonly runtime?: FunctionRuntime;
    /**
     * The Key Value Store to associate with this function.
     *
     * In order to associate a Key Value Store, the `runtime` must be
     * `cloudfront-js-2.0` or newer.
     *
     * Note: AWS limits associations to one key value store per function.
     *
     * @default - no key value store is associated
     */
    readonly keyValueStore?: IKeyValueStore;
    /**
     * A flag that determines whether to automatically publish the function to the LIVE stage when it’s created.
     *
     * @default - true
     */
    readonly autoPublish?: boolean;
}
/**
 * A CloudFront Function
 *
 * @resource aws_cloudfront_function
 */
export declare class Function extends AwsConstructBase implements IFunction {
    readonly resource: cloudfrontFunction.CloudfrontFunction;
    private readonly _outputs;
    get functionOutputs(): FunctionOutputs;
    get outputs(): Record<string, any>;
    /**
     * the name of the CloudFront function
     * @attribute
     */
    readonly functionName: string;
    /**
     * the ARN of the CloudFront function
     * @attribute
     */
    readonly functionArn: string;
    /**
     * the deployment stage of the CloudFront function
     * @attribute
     */
    readonly functionStage: string;
    /**
     * the runtime of the CloudFront function
     * @attribute
     */
    readonly functionRuntime: string;
    constructor(scope: Construct, id: string, props: FunctionProps);
}
/**
 * The type of events that a CloudFront function can be invoked in response to.
 */
export declare enum FunctionEventType {
    /**
     * The viewer-request specifies the incoming request
     */
    VIEWER_REQUEST = "viewer-request",
    /**
     * The viewer-response specifies the outgoing response
     */
    VIEWER_RESPONSE = "viewer-response"
}
/**
 * Represents a CloudFront function and event type when using CF Functions.
 * The type of the `AddBehaviorOptions.functionAssociations` property.
 */
export interface FunctionAssociation {
    /**
     * The CloudFront function that will be invoked.
     */
    readonly function: IFunction;
    /** The type of event which should invoke the function. */
    readonly eventType: FunctionEventType;
}
/**
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-features.html
 * https://registry.terraform.io/providers/hashicorp/aws/5.60.0/docs/resources/cloudfront_function#runtime
 */
export declare enum FunctionRuntime {
    /**
     * cloudfront-js-1.0
     */
    JS_1_0 = "cloudfront-js-1.0",
    /**
     * cloudfront-js-2.0
     */
    JS_2_0 = "cloudfront-js-2.0"
}

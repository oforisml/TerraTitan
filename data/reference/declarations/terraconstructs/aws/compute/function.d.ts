import { lambdaFunction, cloudwatchLogGroup, securityGroup, lambdaEventSourceMapping } from "@cdktf/provider-aws";
import { IResolvable } from "cdktf";
import { Construct } from "constructs";
import { RetentionDays } from "..";
import { Architecture } from "./architecture";
import { EventInvokeConfigOptions } from "./event-invoke-config";
import { IEventSourceMapping } from "./event-source-mapping";
import { AliasOptions, Alias } from "./function-alias";
import { LambdaFunctionBase, IFunction, FunctionAttributes, IEventSource } from "./function-base";
import { FunctionUrl, FunctionUrlOptions } from "./function-url";
import { VpcConfig } from "./function-vpc-config.generated";
import { Duration } from "../../duration";
import * as iam from "../iam";
import { IQueue } from "../notify";
export interface FunctionOutputs {
    /**
     * AWS Lambda function name
     */
    readonly name: string;
    /**
     * AWS Lambda arn of the function
     */
    readonly arn: string;
    /**
     * The IAM Role associated with the Lambda function
     */
    readonly roleArn: string;
    /**
     * Function URL if enabled
     */
    readonly url?: string | IResolvable;
    /**
     * Security group of the function if created
     */
    readonly defaultSecurityGroup?: string | IResolvable;
}
export interface FunctionProps extends EventInvokeConfigOptions {
    /**
     * Force function name (for adoption of existing resources).
     *
     * Prefer to use functionNamePrefix.
     *
     * Use [Terraform Resource Meta Arguments](https://developer.hashicorp.com/terraform/language/resources/syntax#meta-arguments)
     * to control lifecycle when replacing the function.
     *
     * @default - If omitted, Refer to `functionNamePrefix`.
     */
    readonly functionName?: string;
    /**
     * A name prefix for the function.
     *
     * @default - Grid generates a unique physical ID and uses that
     * ID for the function's name.
     */
    readonly functionNamePrefix?: string;
    /**
     * The environment variables to be passed to the Lambda function.
     *
     * Key-value pairs that Lambda caches and makes available for your Lambda
     * functions. Use environment variables to apply configuration changes, such
     * as test and production environment configurations, without changing your
     * Lambda function source code.
     */
    readonly environment?: {
        [key: string]: string;
    };
    /**
     * Description of what your Lambda Function does.
     */
    readonly description?: string;
    /**
     * The system architectures compatible with this lambda function.
     * @default Architecture.X86_64
     */
    readonly architecture?: Architecture;
    /**
     * The tracing mode for the Lambda function.
     *
     * The Lambda function iam role will receive permission to
     * write to AWS X-Ray.
     *
     * @default Tracing.ACTIVE
     */
    readonly tracing?: Tracing;
    /**
     * The log retention period in days. Defaults to 7.
     */
    readonly logRetentionInDays?: RetentionDays;
    /**
     * The memory limit in MB.
     *
     * @default 128.
     */
    readonly memorySize?: number;
    /**
     * The function execution time (in seconds) after which Lambda terminates
     * the function. Because the execution time affects cost, set this value
     * based on the function's expected execution time.
     *
     * @default Duration.seconds(3)
     */
    readonly timeout?: Duration;
    /**
     * Layers for the Lambda.
     */
    readonly layers?: string[];
    /**
     * Initial policy statements to add to the created Lambda Role.
     *
     * You can call `addToRolePolicy` to the created lambda to add statements post creation.
     *
     * @default - No policy statements are added to the created Lambda role.
     */
    readonly initialPolicy?: iam.PolicyStatement[];
    /**
     * Lambda execution role.
     *
     * This is the role that will be assumed by the function upon execution.
     * It controls the permissions that the function will have. The Role must
     * be assumable by the 'lambda.amazonaws.com' service principal.
     *
     * The default Role automatically has permissions granted for Lambda execution. If you
     * provide a Role, you must add the relevant AWS managed policies yourself.
     *
     * The relevant managed policies are "service-role/AWSLambdaBasicExecutionRole" and
     * "service-role/AWSLambdaVPCAccessExecutionRole".
     *
     * @default - A unique role will be generated for this lambda function.
     * Both supplied and generated roles can always be changed by calling `addToRolePolicy`.
     */
    readonly role?: iam.IRole;
    /**
     * Config for network connectivity to AWS resources in a VPC, specify a list
     * of subnet, and optionally security groups, in the VPC.
     *
     * The Lambda function iam role will receive permission to
     * manage ENIs within the provided network.
     *
     * When you connect a function to a VPC, it can only access resources and the internet through that VPC.
     *
     * See [VPC Settings](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html).
     */
    readonly networkConfig?: VpcConfig;
    /**
     * The SQS DLQ.
     *
     * The Lambda function iam role will receive permission to
     * send messages on this queue.
     *
     * @default - no deadletter queue
     */
    readonly deadLetterQueue?: IQueue;
    /**
     * Enabled DLQ. If `deadLetterQueue` is undefined,
     * an SQS queue with default options will be defined for your Function.
     *
     * @default - false unless `deadLetterQueue` is set, which implies DLQ is enabled.
     */
    readonly deadLetterQueueEnabled?: boolean;
    /**
     * Event sources for this function.
     *
     * You can also add event sources using `addEventSource`.
     *
     * @default - No event sources.
     */
    readonly events?: IEventSource[];
    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.60.0/docs/resources/lambda_function#reserved_concurrent_executions LambdaFunction#reserved_concurrent_executions}
     */
    readonly reservedConcurrentExecutions?: number;
    /**
     * Tags to apply to the Lambda function.
     */
    readonly tags?: {
        [key: string]: string;
    };
    /**
     * Setting this property informs the CDK that the imported function ALREADY HAS the necessary permissions
     * for what you are trying to do. When not configured, the CDK attempts to auto-determine whether or not
     * additional permissions are necessary on the function when grant APIs are used. If the CDK tried to add
     * permissions on an imported lambda, it will fail.
     *
     * Set this property *ONLY IF* you are committing to manage the imported function's permissions outside of
     * CDK. You are acknowledging that your CDK code alone will have insufficient permissions to access the
     * imported function.
     *
     * @default false
     */
    readonly skipPermissions?: boolean;
    /**
     * Sets the loggingFormat for the function.
     * @default LoggingFormat.TEXT
     */
    readonly loggingFormat?: LoggingFormat;
    /**
     * Sets the application log level for the function.
     * @default ApplicationLogLevel.INFO
     */
    readonly applicationLogLevel?: ApplicationLogLevel;
    /**
     * Sets the system log level for the function.
     * @default SystemLogLevel.INFO
     */
    readonly systemLogLevel?: SystemLogLevel;
    /**
     * Whether to publish creation/change as new Lambda Function Version.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function#publish LambdaFunction#publish}
     * @default false
     */
    readonly publish?: boolean | IResolvable;
}
/**
 * Provides a Lambda Function resource. Lambda allows you to trigger execution
 * of code in response to events in AWS, enabling serverless backend solutions.
 *
 * The Lambda Function itself includes source code and runtime configuration.
 *
 * This Construct manages permissions as part of the function Principal iam policy.
 * This works for same account resources, but for cross-account resources,
 * you may need to manage access as part of the Resource iam policy.
 *
 * @resource aws_lambda_function
 * @beacon-class compute.IFunction
 */
export declare class LambdaFunction extends LambdaFunctionBase implements IFunction {
    /**
     * Latest published version of your Lambda Function.
     */
    get version(): string;
    /**
     * Import a lambda function into the TerraConstruct spec using its name
     */
    static fromFunctionName(scope: Construct, id: string, functionName: string): IFunction;
    /**
     * Import a lambda function into the TerraConstruct spec using its ARN.
     *
     * For `Function.addPermissions()` to work on this imported lambda, make sure that is
     * in the same account and region as the stack you are importing it into.
     */
    static fromFunctionArn(scope: Construct, id: string, functionArn: string): IFunction;
    /**
     * Creates a Lambda function object which represents a function not defined
     * within this stack.
     *
     * For `Function.addPermissions()` to work on this imported lambda, set the sameEnvironment property to true
     * if this imported lambda is in the same account and region as the stack you are importing it into.
     *
     * @param scope The parent construct
     * @param id The name of the lambda construct
     * @param attrs the attributes of the function to import
     */
    static fromFunctionAttributes(scope: Construct, id: string, attrs: FunctionAttributes): IFunction;
    protected readonly resource: lambdaFunction.LambdaFunction;
    private readonly _outputs;
    /** Strongly Typed Function Outputs */
    get functionOutputs(): FunctionOutputs;
    get outputs(): Record<string, any>;
    /**
     * The name of the function.
     *
     * (not a TOKEN)
     */
    readonly functionName: string;
    /**
     * The ARN fo the function.
     */
    get functionArn(): string;
    /**
     * The ARN fo the function.
     * (if versioning is enabled via publish = true)
     */
    get functionQualifiedArn(): string;
    /**
     * The ARN fo the function.
     */
    get functionQualifiedInvokeArn(): string;
    /**
     * The architecture of this Lambda Function.
     */
    readonly architecture: Architecture;
    /**
     * The principal this Lambda Function is running as
     */
    readonly grantPrincipal: iam.IPrincipal;
    /**
     * The IAM role associated with this function.
     *
     * Undefined if the function was imported without a role.
     */
    readonly role?: iam.IRole;
    /**
     * The DLQ (as queue) associated with this Lambda Function (this is an optional attribute).
     */
    readonly deadLetterQueue?: IQueue;
    /**
     * The timeout configured for this lambda.
     */
    readonly timeout?: Duration;
    /**
     * The construct node where permissions are attached.
     */
    readonly permissionsNode: import("constructs").Node;
    protected readonly canCreatePermissions = true;
    /**
     * Mapping of invocation principals to grants. Used to de-dupe `grantInvoke()` calls.
     * @internal
     */
    protected _invocationGrants: Record<string, iam.Grant>;
    /**
     * Mapping of fucntion URL invocation principals to grants. Used to de-dupe `grantInvokeUrl()` calls.
     * @internal
     */
    protected _functionUrlInvocationGrants: Record<string, iam.Grant>;
    /**
     * The ARN(s) to put into the resource field of the generated IAM policy for grantInvoke()
     */
    get resourceArnsForGrantInvoke(): string[];
    /** @internal */
    readonly _logGroup: cloudwatchLogGroup.CloudwatchLogGroup;
    /**
     * Environment variables for this function
     */
    readonly environment: {
        [key: string]: string;
    };
    private _url?;
    /**
     * HTTP Endpoint for this function if defined.
     *
     * use `addFunctionUrl` to enable Endpoint.
     */
    get url(): string | undefined;
    private _eventSources;
    get eventSources(): lambdaEventSourceMapping.LambdaEventSourceMapping[];
    private _securityGroup?;
    get securityGroup(): securityGroup.SecurityGroup | undefined;
    constructor(scope: Construct, name: string, props: FunctionProps);
    /**
     * Adds an environment variable to this Lambda function.
     * If this is a ref to a Lambda function, this operation results in a no-op.
     * @param key The environment variable key.
     * @param value The environment variable's value.
     */
    addEnvironment(key: string, value: string): IFunction;
    addFunctionUrl(options?: FunctionUrlOptions): FunctionUrl;
    /**
     * Get Logging Config propety for the function.
     * This method returns the function LoggingConfig Property if the property is set on the
     * function and undefined if not.
     */
    private getLoggingConfig;
    /**
     * Defines an alias for this function.
     *
     * The alias will automatically be updated to point to the latest version of
     * the function as it is being updated during a deployment.
     *
     * ```ts
     * declare const fn: compute.LambdaFunction;
     *
     * fn.addAlias('Live');
     *
     * // Is equivalent to
     *
     * new compute.Alias(this, 'AliasLive', {
     *   aliasName: 'Live',
     *   version: fn.version,
     * });
     * ```
     *
     * @param aliasName The name of the alias
     * @param options Alias options
     */
    addAlias(aliasName: string, options?: AliasOptions): Alias;
    /**
     * Optionally create LambdaFunctionVpcConfig
     */
    private parseVpcConfig;
    private isQueue;
    private buildDeadLetterQueue;
    /**
     * Optionally create LambdaFunctionDeadLetterConfig
     */
    private parseDeadLetterConfig;
    private parseTracingConfig;
}
/**
 * X-Ray Tracing Modes (https://docs.aws.amazon.com/lambda/latest/dg/API_TracingConfig.html)
 */
export declare enum Tracing {
    /**
     * Lambda will respect any tracing header it receives from an upstream service.
     * If no tracing header is received, Lambda will sample the request based on a fixed rate. Please see the [Using AWS Lambda with AWS X-Ray](https://docs.aws.amazon.com/lambda/latest/dg/services-xray.html) documentation for details on this sampling behavior.
     */
    ACTIVE = "Active",
    /**
     * Lambda will only trace the request from an upstream service
     * if it contains a tracing header with "sampled=1"
     */
    PASS_THROUGH = "PassThrough",
    /**
     * Lambda will not trace any request.
     */
    DISABLED = "Disabled"
}
/**
 * Lambda service will automatically captures system logs about function invocation
 * generated by the Lambda service (known as system logs) and sends these logs to a
 * default CloudWatch log group named after the Lambda function.
 */
export declare enum SystemLogLevel {
    /**
     * Lambda will capture only logs at info level.
     */
    INFO = "INFO",
    /**
     * Lambda will capture only logs at debug level.
     */
    DEBUG = "DEBUG",
    /**
     * Lambda will capture only logs at warn level.
     */
    WARN = "WARN"
}
/**
 * Lambda service automatically captures logs generated by the function code
 * (known as application logs) and sends these logs to a default CloudWatch
 * log group named after the Lambda function.
 */
export declare enum ApplicationLogLevel {
    /**
     * Lambda will capture only logs at info level.
     */
    INFO = "INFO",
    /**
     * Lambda will capture only logs at debug level.
     */
    DEBUG = "DEBUG",
    /**
     * Lambda will capture only logs at warn level.
     */
    WARN = "WARN",
    /**
     * Lambda will capture only logs at trace level.
     */
    TRACE = "TRACE",
    /**
     * Lambda will capture only logs at error level.
     */
    ERROR = "ERROR",
    /**
     * Lambda will capture only logs at fatal level.
     */
    FATAL = "FATAL"
}
/**
 * This field takes in 2 values either Text or JSON. By setting this value to Text,
 * will result in the current structure of logs format, whereas, by setting this value to JSON,
 * Lambda will print the logs as Structured JSON Logs, with the corresponding timestamp and log level
 * of each event. Selecting ‘JSON’ format will only allow customer’s to have different log level
 * Application log level and the System log level.
 */
export declare enum LoggingFormat {
    /**
     * Lambda Logs text format.
     */
    TEXT = "Text",
    /**
     * Lambda structured logging in Json format.
     */
    JSON = "JSON"
}
/**
 * A destination configuration
 */
export interface DlqDestinationConfig {
    /**
     * The Amazon Resource Name (ARN) of the destination resource
     */
    readonly destination: string;
}
/**
 * A DLQ for an event source
 */
export interface IEventSourceDlq {
    /**
     * Returns the DLQ destination config of the DLQ
     */
    bind(target: IEventSourceMapping, targetHandler: IFunction): DlqDestinationConfig;
}

import { IResolvable } from "cdktf";
import { Node } from "constructs";
import { AwsConstructBase, IAwsConstruct } from "../aws-construct";
import { Architecture } from "./architecture";
import { EventInvokeConfigOptions } from "./event-invoke-config";
import { EventSourceMapping, EventSourceMappingOptions } from "./event-source-mapping";
import { Permission } from "./function-permission";
import { FunctionUrlOptions, FunctionUrl } from "./function-url";
import * as iam from "../iam";
/**
 * Represents a Lambda function defined outside of this stack.
 */
export interface FunctionAttributes {
    /**
     * The ARN of the Lambda function.
     *
     * Format: arn:<partition>:lambda:<region>:<account-id>:function:<function-name>
     */
    readonly functionArn: string;
    /**
     * The IAM execution role associated with this function.
     *
     * If the role is not specified, any role-related operations will no-op.
     */
    readonly role?: iam.IRole;
    /**
     * The security group of this Lambda, if in a VPC.
     *
     * This needs to be given in order to support allowing connections
     * to this Lambda.
     */
    readonly securityGroup?: string | IResolvable;
    /**
     * Setting this property informs the CDK that the imported function is in the same environment as the stack.
     * This affects certain behaviours such as, whether this function's permission can be modified.
     * When not configured, the CDK attempts to auto-determine this. For environment agnostic stacks, i.e., stacks
     * where the account is not specified with the `env` property, this is determined to be false.
     *
     * Set this to property *ONLY IF* the imported function is in the same account as the stack
     * it's imported in.
     * @default - depends: true, if the Stack is configured with an explicit `env` (account and region) and the account is the same as this function.
     * For environment-agnostic stacks this will default to `false`.
     */
    readonly sameEnvironment?: boolean;
    /**
     * Setting this property informs the TerraConstruct that the imported function ALREADY HAS the necessary permissions
     * for what you are trying to do. When not configured, E.T, attempts to auto-determine whether or not
     * additional permissions are necessary on the function when grant APIs are used. If TerraConstruct tried to add
     * permissions on an imported lambda, it will fail.
     *
     * Set this property *ONLY IF* you are committing to manage the imported function's permissions outside of
     * this TerraConstruct stack. You are acknowledging that your TerraConstruct code alone will have insufficient permissions to access the
     * imported function.
     *
     * @default false
     */
    readonly skipPermissions?: boolean;
    /**
     * The architecture of this Lambda Function (this is an optional attribute and defaults to X86_64).
     * @default - Architecture.X86_64
     */
    readonly architecture?: Architecture;
}
/**
 * A Lambda function.
 */
export interface IFunction extends IAwsConstruct, iam.IGrantable {
    /**
     * The name of the function.
     *
     * @attribute
     */
    readonly functionName: string;
    /**
     * The ARN of the function.
     *
     * @attribute
     */
    readonly functionArn: string;
    /**
     * The IAM role associated with this function.
     */
    readonly role?: iam.IRole;
    /**
     * The construct node where permissions are attached.
     */
    readonly permissionsNode: Node;
    /**
     * The system architectures compatible with this lambda function.
     */
    readonly architecture: Architecture;
    /**
     * Adds an event source that maps to this AWS Lambda function.
     * @param id construct ID
     * @param options mapping options
     */
    addEventSourceMapping(id: string, options: EventSourceMappingOptions): EventSourceMapping;
    /**
     * Adds an event source to this function.
     *
     * The following example adds an SQS Queue as an event source:
     * ```
     * import { compute } from 'terraconstructs';
     * myFunction.addEventSource(new compute.SqsEventSource(myQueue));
     * ```
     */
    addEventSource(source: IEventSource): void;
    /**
     * Adds a permission to the Lambda resource policy.
     * @param id The id for the permission construct
     * @param permission The permission to grant to this Lambda function. @see Permission for details.
     */
    addPermission(id: string, permission: Permission): void;
    /**
     * Adds a statement to the IAM role assumed by the instance.
     */
    addToRolePolicy(statement: iam.PolicyStatement): void;
    /**
     * Grant the given identity permissions to invoke this Lambda
     */
    grantInvoke(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to invoke the $LATEST version or
     * unqualified version of this Lambda
     */
    grantInvokeLatestVersion(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to invoke the given (or latest) version of this Lambda
     */
    grantInvokeVersion(identity: iam.IGrantable, version: string): iam.Grant;
    /**
     * Grant the given identity permissions to invoke this Lambda Function URL
     */
    grantInvokeUrl(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant multiple principals the ability to invoke this Lambda via CompositePrincipal
     */
    grantInvokeCompositePrincipal(compositePrincipal: iam.CompositePrincipal): iam.Grant[];
    /**
     * Configures options for asynchronous invocation.
     */
    configureAsyncInvoke(options: EventInvokeConfigOptions): void;
    /**
     * Adds a url to this lambda function.
     */
    addFunctionUrl(options?: FunctionUrlOptions): FunctionUrl;
}
export declare abstract class LambdaFunctionBase extends AwsConstructBase implements IFunction {
    /**
     * The name of the function.
     */
    abstract readonly functionName: string;
    /**
     * The principal this Lambda Function is running as
     */
    abstract readonly grantPrincipal: iam.IPrincipal;
    /**
     * The ARN fo the function.
     *
     * Should include version (if versioning is enabled via publish = true)
     */
    abstract readonly functionArn: string;
    /**
     * Latest published version of your Lambda Function.
     *
     * Used as qualifier of the version or alias of this function.
     * A qualifier is the identifier that's appended to a version or alias ARN.
     * @see https://docs.aws.amazon.com/lambda/latest/dg/API_GetFunctionConfiguration.html#API_GetFunctionConfiguration_RequestParameters
     */
    abstract readonly version: string;
    /**
     * The qualifier of the version or alias of this function.
     * A qualifier is the identifier that's appended to a version or alias ARN.
     * @see https://docs.aws.amazon.com/lambda/latest/dg/API_GetFunctionConfiguration.html#API_GetFunctionConfiguration_RequestParameters
     */
    /**
     * The IAM role associated with this function.
     *
     * Undefined if the function was imported without a role.
     */
    abstract readonly role?: iam.IRole;
    /**
     * The construct node where permissions are attached.
     */
    abstract readonly permissionsNode: Node;
    /**
     * The architecture of this Lambda Function.
     */
    abstract readonly architecture: Architecture;
    /**
     * Whether the addPermission() call adds any permissions
     *
     * True for new Lambdas, false for version $LATEST and imported Lambdas
     * from different accounts.
     */
    protected abstract readonly canCreatePermissions: boolean;
    /**
     * The ARN(s) to put into the resource field of the generated IAM policy for grantInvoke()
     */
    abstract readonly resourceArnsForGrantInvoke: string[];
    /**
     * Whether the user decides to skip adding permissions.
     * The only use case is for cross-account, imported lambdas
     * where the user commits to modifying the permisssions
     * on the imported lambda outside this TerraConstruct Spec.
     * @internal
     */
    protected readonly _skipPermissions?: boolean;
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
     * Adds a permission to the Lambda resource policy.
     * @param id The id for the permission construct
     * @param permission The permission to grant to this Lambda function. @see Permission for details.
     */
    addPermission(id: string, permission: Permission): void;
    /**
     * Adds a statement to the IAM role assumed by the instance.
     */
    addToRolePolicy(statement: iam.PolicyStatement): void;
    addEventSourceMapping(id: string, options: EventSourceMappingOptions): EventSourceMapping;
    /**
     * Grant the given identity permissions to invoke this Lambda
     */
    grantInvoke(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to invoke the $LATEST version or
     * unqualified version of this Lambda
     */
    grantInvokeLatestVersion(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to invoke the given version of this Lambda
     */
    grantInvokeVersion(grantee: iam.IGrantable, version: string): iam.Grant;
    /**
     * Grant the given identity permissions to invoke this Lambda Function URL
     */
    grantInvokeUrl(grantee: iam.IGrantable): iam.Grant;
    /**
     * Grant multiple principals the ability to invoke this Lambda via CompositePrincipal
     */
    grantInvokeCompositePrincipal(compositePrincipal: iam.CompositePrincipal): iam.Grant[];
    addEventSource(source: IEventSource): void;
    configureAsyncInvoke(options: EventInvokeConfigOptions): void;
    /**
     * A function URL is a dedicated HTTP(S) endpoint for a Lambda function.
     */
    addFunctionUrl(options?: FunctionUrlOptions): FunctionUrl;
    /**
     * Returns the construct tree node that corresponds to the lambda function.
     * For use internally for constructs, when the tree is set up in non-standard ways. Ex: SingletonFunction.
     * @internal
     */
    protected _functionNode(): Node;
    /**
     * Given the function arn, check if the account id matches this account
     *
     * Function ARNs look like this:
     *
     *   arn:aws:lambda:region:account-id:function:function-name
     *
     * ..which means that in order to extract the `account-id` component from the ARN, we can
     * split the ARN using ":" and select the component in index 4.
     *
     * @returns true if account id of function matches the account specified on the stack, false otherwise.
     *
     * @internal
     */
    protected _isStackAccount(): boolean;
    private grant;
    /**
     * Translate IPrincipal to something we can pass to aws_lambda_permission
     * https://docs.aws.amazon.com/lambda/latest/api/API_AddPermission.html#lambda-AddPermission-request-Principal
     * https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/lambda_permission#principal
     *
     * Do some nasty things because `Permission` supports a subset of what the
     * full IAM principal language supports, and we may not be able to parse strings
     * outright because they may be tokens.
     *
     * Try to recognize some specific Principal classes first, then try a generic
     * fallback.
     */
    private parsePermissionPrincipal;
    private validateConditionCombinations;
    private validateConditions;
    private isPrincipalWithConditions;
}
export declare abstract class QualifiedFunctionBase extends LambdaFunctionBase {
    /** The underlying `IFunction` */
    abstract readonly lambda: IFunction;
    readonly permissionsNode: Node;
    get resourceArnsForGrantInvoke(): string[];
    configureAsyncInvoke(options: EventInvokeConfigOptions): void;
}
/**
 * An abstract class which represents an AWS Lambda event source.
 */
export interface IEventSource {
    /**
     * Called by `lambda.addEventSource` to allow the event source to bind to this
     * function.
     *
     * @param target That lambda function to bind to.
     */
    bind(target: IFunction): void;
}

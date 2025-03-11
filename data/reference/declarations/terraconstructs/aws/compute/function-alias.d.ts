import { lambdaAlias } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { Architecture } from "./architecture";
import { EventInvokeConfigOptions } from "./event-invoke-config";
import { IFunction, QualifiedFunctionBase } from "./function-base";
/**
 * Outputs that can be exposed through the grid
 */
export interface AliasOutputs {
    /**
     * The Amazon Resource Name (ARN) identifying your Lambda function alias.
     */
    readonly name: string;
    /**
     * The ARN to be used for invoking Lambda Function from API Gateway - to be used in `aws_api_gateway_integration`'s uri
     */
    readonly invokeArn: string;
}
export interface IAlias extends IFunction {
    /** strongly typed aliasOutputs */
    readonly aliasOutputs: AliasOutputs;
    /**
     * Name of this alias.
     *
     * @attribute
     */
    readonly aliasName: string;
    /**
     * The underlying Lambda function
     */
    readonly lambda: IFunction;
    /**
     * The underlying Lambda function version.
     */
    readonly version: string;
}
/**
 * Options for `lambda.Alias`.
 */
export interface AliasOptions extends EventInvokeConfigOptions {
    /**
     * Description for the alias
     *
     * @default No description
     */
    readonly description?: string;
    /**
     * Additional versions with individual weights this alias points to
     *
     * Individual additional version weights specified here should add up to
     * (less than) one. All remaining weight is routed to the default
     * version.
     *
     * For example, the config is
     *
     *    version: "1"
     *    additionalVersions: [{ version: "2", weight: 0.05 }]
     *
     * Then 5% of traffic will be routed to function version 2, while
     * the remaining 95% of traffic will be routed to function version 1.
     *
     * @default No additional versions
     */
    readonly additionalVersions?: VersionWeight[];
}
/**
 * Properties for a new Lambda alias
 */
export interface AliasProps extends AliasOptions {
    /**
     * Name of this alias
     *
     * Minimum length of 1. Maximum length of 128.
     * Pattern: (?!^[0-9]+$)([a-zA-Z0-9-_]+)
     *
     */
    readonly aliasName: string;
    /**
     * Function this alias refers to
     */
    readonly function: IFunction;
    /**
     * Function version this alias refers to
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/lambda_alias#function_version LambdaAlias#function_version}
     * pattern (\$LATEST|[0-9]+)
     */
    readonly version: string;
}
export interface AliasAttributes {
    readonly aliasName: string;
    readonly function: IFunction;
}
/**
 * A new alias to a particular version of a Lambda function.
 */
export declare class Alias extends QualifiedFunctionBase implements IAlias {
    static fromAliasAttributes(scope: Construct, id: string, attrs: AliasAttributes): IAlias;
    readonly resource: lambdaAlias.LambdaAlias;
    private readonly _aliasOutputs;
    get aliasOutputs(): AliasOutputs;
    get outputs(): Record<string, any>;
    /**
     * Name of this alias.
     *
     * @attribute
     */
    readonly aliasName: string;
    /**
     * Name of this alias
     *
     * Used to be able to use Alias in place of a regular Lambda. Lambda accepts
     * ARNs everywhere it accepts function names.
     */
    readonly functionName: string;
    readonly lambda: IFunction;
    readonly architecture: Architecture;
    readonly version: string;
    /**
     * ARN of this alias
     *
     * Used to be able to use Alias in place of a regular Lambda. Lambda accepts
     * ARNs everywhere it accepts function names.
     */
    readonly functionArn: string;
    protected readonly qualifier: string;
    protected readonly canCreatePermissions: boolean;
    constructor(scope: Construct, id: string, props: AliasProps);
    get grantPrincipal(): import("../iam").IPrincipal;
    get role(): import("../iam").IRole | undefined;
    /**
     * Calculate the routingConfig parameter from the input props
     */
    private determineRoutingConfig;
}
/**
 * A version/weight pair for routing traffic to Lambda functions
 */
export interface VersionWeight {
    /**
     * The version to route traffic to
     */
    readonly version: string;
    /**
     * How much weight to assign to this version (0..1)
     */
    readonly weight: number;
}

import { Construct } from "constructs";
import { AwsStack } from "./aws-stack";
import { TerraConstructBase, TerraConstructProps, ITerraConstruct } from "../construct-base";
/**
 * Represents the environment a given AwsConstruct lives in.
 * Used as the return value for the `IResource.env` property.
 */
export interface AwsEnvironment {
    /**
     * The AWS partition that this resource belongs to.
     */
    readonly partition: string;
    /**
     * The AWS account ID that this resource belongs to.
     */
    readonly account: string;
    /**
     * The AWS region that this resource belongs to.
     */
    readonly region: string;
}
/**
 * Represents an AWS resource similar to the AWS CDK `Resource` class but backed by CDKTF.
 */
export interface IAwsConstruct extends ITerraConstruct {
    /**
     * The stack into which this resource is constructed by the TerraConstruct.
     */
    readonly stack: AwsStack;
    /**
     * The environment this resource belongs to.
     * For resources that are created and managed by the CDKTF
     * (generally, those created by creating new class instances like Environment, EcsDeployment, etc.),
     * this is always the same as the environment of the stack they belong to;
     * however, for imported resources
     * (those obtained from static methods like fromRoleArn, fromBucketName, etc.),
     * that might be different than the stack they were imported into.
     */
    readonly env: AwsEnvironment;
}
/**
 * Construction properties for `Resource`.
 */
export interface AwsConstructProps extends TerraConstructProps {
    /**
     * The AWS account ID this resource belongs to.
     *
     * @default - the resource is in the same account as the stack it belongs to
     */
    readonly account?: string;
    /**
     * The AWS region this resource belongs to.
     *
     * @default - the resource is in the same region as the stack it belongs to
     */
    readonly region?: string;
    /**
     * ARN to deduce region and account from
     *
     * The ARN is parsed and the account and region are taken from the ARN.
     * This should be used for imported resources.
     *
     * Cannot be supplied together with either `account` or `region`.
     *
     * @default - take environment from `account`, `region` parameters, or use Stack environment.
     */
    readonly environmentFromArn?: string;
}
/**
 * Represents an AWS resource similar to the AWS CDK `Resource` class but backed by CDKTF.
 */
export declare abstract class AwsConstructBase extends TerraConstructBase implements IAwsConstruct {
    readonly stack: AwsStack;
    readonly env: AwsEnvironment;
    constructor(scope: Construct, id: string, props?: AwsConstructProps);
}

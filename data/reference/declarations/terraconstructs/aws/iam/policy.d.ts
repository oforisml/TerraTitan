import { Construct } from "constructs";
import { IAwsConstruct, AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { IPolicyDocument } from "./policy-document";
import { PolicyStatement } from "./policy-statement";
import { IGrantable, IPrincipal } from "./principals";
import { IRole } from "./role";
export declare const MAX_POLICY_NAME_LEN = 128;
/**
 * Represents an IAM Policy
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_manage.html
 */
export interface IPolicy extends IAwsConstruct {
    /**
     * The name of this policy.
     *
     * @attribute
     */
    readonly policyName: string;
}
/**
 * Properties for defining an IAM inline policy document
 */
export interface PolicyProps extends AwsConstructProps {
    /**
     * The name of the policy. If you specify multiple policies for an entity,
     * specify unique names. For example, if you specify a list of policies for
     * an IAM role, each policy must have a unique name.
     *
     * @default - Uses the logical ID of the policy resource, which is ensured
     * to be unique within the stack.
     */
    readonly policyName?: string;
    /**
     * Roles to attach this policy to.
     * You can also use `attachToRole(role)` to attach this policy to a role.
     *
     * @default - No roles.
     */
    readonly roles?: IRole[];
    /**
     * Initial set of permissions to add to this policy document.
     * You can also use `addStatements(...statement)` to add permissions later.
     *
     * @default - No statements.
     */
    readonly statements?: PolicyStatement[];
    /**
     * In cases where you know the policy must be created and it is actually
     * an error if no statements have been added to it or it remains unattached to
     * an IAM identity, you can set this to `true`.
     *
     * @default false
     */
    readonly force?: boolean;
    /**
     * Initial PolicyDocument to use for this Policy. If omited, any
     * `PolicyStatement` provided in the `statements` property will be applied
     * against the empty default `PolicyDocument`.
     *
     * @default - An empty policy.
     */
    readonly document?: IPolicyDocument;
}
/**
 * The Policy resource associates an [inline](https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#inline)
 * IAM policy with IAM users, roles, or groups. For more information about IAM policies, see
 * [Overview of IAM Policies](http://docs.aws.amazon.com/IAM/latest/UserGuide/policies_overview.html)
 * in the IAM User Guide guide.
 *
 * Also refer to:
 * - [Iam Role Policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy)
 * - [Iam Group Policy](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_group_policy)
 */
export declare class Policy extends AwsConstructBase implements IPolicy, IGrantable {
    /**
     * Import a policy in this app based on its name
     */
    static fromPolicyName(scope: Construct, id: string, policyName: string): IPolicy;
    /**
     * The policy document.
     */
    readonly document: IPolicyDocument;
    readonly grantPrincipal: IPrincipal;
    get outputs(): Record<string, any>;
    private readonly _policyName;
    private readonly roles;
    private readonly force;
    private referenceTaken;
    constructor(scope: Construct, id: string, props?: PolicyProps);
    /**
     * Adds a statement to the policy document.
     */
    addStatements(...statement: PolicyStatement[]): void;
    /**
     * Attaches this policy to a role.
     *
     * NOTE: Using this method will conflict with a role that has
     * exclusive management of the role's policy attachments.
     *
     * If you attempt to manage a role's policies by multiple means,
     * you will get resource cycling and/or errors.
     */
    attachToRole(role: IRole): void;
    /**
     * The name of this policy.
     *
     * @attribute
     */
    get policyName(): string;
    private validatePolicy;
    /**
     * Whether the policy resource has been attached to any identity
     */
    private get isAttached();
    /**
     * Adds resource to the terraform JSON output.
     *
     * called by TerraformStack.prepareStack()
     */
    toTerraform(): any;
}

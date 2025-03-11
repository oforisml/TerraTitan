import { iamRole } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { Grant } from "./grant";
import { IIdentity } from "./identity-base";
import { IManagedPolicy } from "./managed-policy";
import { Policy } from "./policy";
import { PolicyDocument } from "./policy-document";
import { PolicyStatement } from "./policy-statement";
import { AddToPrincipalPolicyResult, IPrincipal, PrincipalPolicyFragment } from "./principals";
import { Duration } from "../..";
/**
 * Properties for defining an IAM Role
 */
export interface RoleProps extends AwsConstructProps {
    /**
     * The IAM principal (i.e. `new ServicePrincipal('sns.amazonaws.com')`)
     * which can assume this role.
     *
     * You can later modify the assume role policy document by accessing it via
     * the `assumeRolePolicy` property.
     */
    readonly assumedBy: IPrincipal;
    /**
     * ID that the role assumer needs to provide when assuming this role
     *
     * If the configured and provided external IDs do not match, the
     * AssumeRole operation will fail.
     *
     * @deprecated see `externalIds`
     *
     * @default No external ID required
     */
    readonly externalId?: string;
    /**
     * List of IDs that the role assumer needs to provide one of when assuming this role
     *
     * If the configured and provided external IDs do not match, the
     * AssumeRole operation will fail.
     *
     * @default No external ID required
     */
    readonly externalIds?: string[];
    /**
     * A list of managed policies associated with this role.
     *
     * You can add managed policies later using
     * `addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName(policyName))`.
     *
     * @default - No managed policies.
     */
    readonly managedPolicies?: IManagedPolicy[];
    /**
     * A list of named policies to inline into this role. These policies will be
     * created with the role, whereas those added by ``addToPolicy`` are added
     * using a separate CloudFormation resource (allowing a way around circular
     * dependencies that could otherwise be introduced).
     *
     * @default - No policy is inlined in the Role resource.
     */
    readonly inlinePolicies?: {
        [name: string]: PolicyDocument;
    };
    /**
     * The path associated with this role. For information about IAM paths, see
     * Friendly Names and Paths in IAM User Guide.
     *
     * @default /
     */
    readonly path?: string;
    /**
     * AWS supports permissions boundaries for IAM entities (users or roles).
     * A permissions boundary is an advanced feature for using a managed policy
     * to set the maximum permissions that an identity-based policy can grant to
     * an IAM entity. An entity's permissions boundary allows it to perform only
     * the actions that are allowed by both its identity-based policies and its
     * permissions boundaries.
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-iam-role.html#cfn-iam-role-permissionsboundary
     * @link https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies_boundaries.html
     *
     * @default - No permissions boundary.
     */
    readonly permissionsBoundary?: IManagedPolicy;
    /**
     * A name for the IAM role. For valid values, see the RoleName parameter for
     * the CreateRole action in the IAM API Reference.
     *
     * IMPORTANT: If you specify a name, you cannot perform updates that require
     * replacement of this resource. You can perform updates that require no or
     * some interruption. If you must replace the resource, specify a new name.
     *
     * Use [Terraform Resource Meta Arguments](https://developer.hashicorp.com/terraform/language/resources/syntax#meta-arguments)
     * to control lifecycle when replacing the role.
     *
     * See [IAM Identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html)
     * for more information
     *
     * @default - If omitted, Refer to `roleNamePrefix`.
     */
    readonly roleName?: string;
    /**
     * Creates a unique name beginning with the specified prefix.
     * Conflicts with `roleName`.
     *
     * IMPORTANT: If you specify a namePrefix, you cannot perform updates that require
     * replacement of this resource. You can perform updates that require no or
     * some interruption. If you must replace the resource, specify a new name.
     *
     * Use [Terraform Resource Meta Arguments](https://developer.hashicorp.com/terraform/language/resources/syntax#meta-arguments)
     * to control lifecycle when replacing the role.
     *
     * See [IAM Identifiers](https://docs.aws.amazon.com/IAM/latest/UserGuide/Using_Identifiers.html)
     * for more information
     *
     * @default - If omitted, ET will assign a random, unique name prefixed by GridUUID.
     */
    readonly roleNamePrefix?: string;
    /**
     * The maximum session duration in seconds that you want to set for the specified role.
     * This setting can have a value from 1 hour (3600sec) to 12 (43200sec) hours.
     *
     * Anyone who assumes the role from the AWS CLI or API can use the
     * DurationSeconds API parameter or the duration-seconds CLI parameter to
     * request a longer session. The MaxSessionDuration setting determines the
     * maximum duration that can be requested using the DurationSeconds
     * parameter.
     *
     * If users don't specify a value for the DurationSeconds parameter, their
     * security credentials are valid for one hour by default. This applies when
     * you use the AssumeRole* API operations or the assume-role* CLI operations
     * but does not apply when you use those operations to create a console URL.
     *
     * @link https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use.html
     *
     * @default Duration.hours(1)
     */
    readonly maxSessionDuration?: Duration;
    /**
     * A description of the role. It can be up to 1000 characters long.
     *
     * @default - No description.
     */
    readonly description?: string;
    /**
     * Whether to force detaching any policies the role has before destroying it
     * If policies are attached to the role via the `aws_iam_policy_attachment`
     * resource and you are modifying the role `name` or `path`, this must be
     * set to `true` and applied before attempting the operation otherwise you
     * will encounter a `DeleteConflict` error.
     *
     * The `aws_iam_role_policy_attachment` resource (recommended) does not
     * have this requirement.
     *
     * NOTE: The `iam.Policy` uses `aws_iam_role_policy_attachment` under
     * the hood and this should not be a concern.
     *
     * @default - false
     */
    readonly forceDetachPolicies?: boolean;
}
/**
 * Options allowing customizing the behavior of `Role.fromRoleArn`.
 */
export interface FromRoleArnOptions {
    /**
     * Whether the imported role can be modified by attaching policy resources to it.
     *
     * @default true
     */
    readonly mutable?: boolean;
    /**
     * For immutable roles: add grants to resources instead of dropping them
     *
     * If this is `false` or not specified, grant permissions added to this role are ignored.
     * It is your own responsibility to make sure the role has the required permissions.
     *
     * If this is `true`, any grant permissions will be added to the resource instead.
     *
     * @default false
     */
    readonly addGrantsToResources?: boolean;
    /**
     * Any policies created by this role will use this value as their ID, if specified.
     * Specify this if importing the same role in multiple stacks, and granting it
     * different permissions in at least two stacks. If this is not specified
     * (or if the same name is specified in more than one stack),
     * a Terraform issue will result in the policy created in whichever stack
     * is deployed last overwriting the policies created by the others.
     *
     * @default 'Policy'
     */
    readonly defaultPolicyName?: string;
}
/**
 * Options allowing customizing the behavior of `Role.fromRoleName`.
 */
export interface FromRoleNameOptions extends FromRoleArnOptions {
}
/**
 * IAM Role
 *
 * Defines an IAM role. The role is created with an assume policy document associated with
 * the specified AWS service principal defined in `serviceAssumeRole`.
 */
export declare class Role extends AwsConstructBase implements IRole {
    /**
     * Import an external role by ARN.
     *
     * If the imported Role ARN is a Token (such as a
     * `CfnParameter.valueAsString` or a `Fn.importValue()`) *and* the referenced
     * role has a `path` (like `arn:...:role/AdminRoles/Alice`), the
     * `roleName` property will not resolve to the correct value. Instead it
     * will resolve to the first path component. We unfortunately cannot express
     * the correct calculation of the full path name as a CloudFormation
     * expression. In this scenario the Role ARN should be supplied without the
     * `path` in order to resolve the correct role resource.
     *
     * @param scope construct scope
     * @param id construct id
     * @param roleArn the ARN of the role to import
     * @param options allow customizing the behavior of the returned role
     */
    static fromRoleArn(scope: Construct, id: string, roleArn: string, options?: FromRoleArnOptions): IRole;
    /**
     * Return whether the given object is a Role
     */
    static isRole(x: any): x is Role;
    /**
     * Import an external role by name.
     *
     * The imported role is assumed to exist in the same account as the account
     * the scope's containing Stack is being deployed to.
  
     * @param scope construct scope
     * @param id construct id
     * @param roleName the name of the role to import
     * @param options allow customizing the behavior of the returned role
     */
    static fromRoleName(scope: Construct, id: string, roleName: string, options?: FromRoleNameOptions): IRole;
    readonly grantPrincipal: IPrincipal;
    readonly principalAccount: string | undefined;
    readonly assumeRoleAction: string;
    /**
     * The assume role policy document associated with this role.
     */
    readonly assumeRolePolicy?: PolicyDocument;
    /**
     * Returns the ARN of this role.
     */
    readonly roleArn: string;
    /**
     * Returns the name of the role.
     */
    readonly roleName: string;
    /**
     * Returns the role.
     */
    readonly policyFragment: PrincipalPolicyFragment;
    /**
     * Returns the permissions boundary attached to this role
     */
    readonly permissionsBoundary?: IManagedPolicy;
    /** Strongly typed Outputs */
    get roleOutputs(): RoleOutputs;
    get outputs(): Record<string, any>;
    /**
     * Direct access to the underlying Terraform resource.
     */
    readonly resource: iamRole.IamRole;
    private defaultPolicy?;
    private readonly managedPolicies;
    private readonly attachedPolicies;
    private readonly inlinePolicies;
    private immutableRole?;
    private readonly _roleId;
    constructor(scope: Construct, id: string, props: RoleProps);
    /**
     * Adds a permission to the role's default policy document.
     * If there is no default policy attached to this role, it will be created.
     * @param statement The permission statement to add to the policy document
     */
    addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult;
    addToPolicy(statement: PolicyStatement): boolean;
    /**
     * Attaches a managed policy to this role.
     *
     * NOTE: Using this method will force the role to take over
     * exclusive management of the role's ManagedPolicy attachments
     * These arguments are incompatible with other ways of managing
     * a role's such as attaching the policy to the role through its
     * `policy.attachToRole(role)` method.
     *
     * If you attempt to manage a role's policies by multiple means,
     * you will get resource cycling and/or errors.
     *
     * ```typescript
     * const policy1 = new iam.ManagedPolicy(this, 'Policy', {
     *   managedPolicyName: 'MyPolicy1',
     *   description: 'A description of the policy',
     * });
     * const policy2 = new iam.ManagedPolicy(this, 'Policy', {
     *   managedPolicyName: 'MyPolicy2',
     *   description: 'A description of the policy',
     * });
     *
     * const role = new iam.Role(this, 'Role', {
     *  assumedBy: new iam.ServicePrincipal('sns.amazonaws.com'),
     * });
     * // role becomes the manager of all attached policies
     * role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'));
     * role.addManagedPolicy(policy1);
     *
     * // this introduces resource cycling
     * // DON'T DO THIS
     * policy2.attachToRole(role);
     *
     * // DO THIS INSTEAD
     * role.addManagedPolicy(policy2);
     * ```
     * @param policy The the managed policy to attach.
     */
    addManagedPolicy(policy: IManagedPolicy): void;
    /**
     * Attaches a policy to this role.
     *
     * NOTE: Using this method will force the role to take over
     * exclusive management of the role's inline Policy attachments
     * These arguments are incompatible with other ways of managing
     * a role's such as attaching a policy to the role.
     * If you attempt to manage a role's policies by multiple means,
     * you will get resource cycling and/or errors.
     *
     * @param policy The policy to attach
     */
    attachInlinePolicy(policy: Policy): void;
    /**
     * Grant the actions defined in actions to the identity Principal on this resource.
     */
    grant(grantee: IPrincipal, ...actions: string[]): Grant;
    /**
     * Grant permissions to the given principal to pass this role.
     */
    grantPassRole(identity: IPrincipal): Grant;
    /**
     * Grant permissions to the given principal to assume this role.
     */
    grantAssumeRole(identity: IPrincipal): Grant;
    /**
     * Returns the stable and unique string identifying the role. For example,
     * AIDAJQABLZS4A3QDU576Q.
     *
     * @attribute
     */
    get roleId(): string;
    /**
     * Return a copy of this Role object whose Policies will not be updated
     *
     * Use the object returned by this method if you want this Role to be used by
     * a construct without it automatically updating the Role's Policies.
     *
     * If you do, you are responsible for adding the correct statements to the
     * Role's policies yourself.
     */
    withoutPolicyUpdates(options?: WithoutPolicyUpdatesOptions): IRole;
    private validateRole;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface RoleOutputs {
    readonly arn: string;
    readonly name: string;
}
/**
 * A Role object
 */
export interface IRole extends IIdentity {
    /**
     * strongly typed roleOutputs
     *
     * @attribute
     */
    readonly roleOutputs: RoleOutputs;
    /**
     * Returns the ARN of this role.
     *
     * @attribute
     */
    readonly roleArn: string;
    /**
     * Returns the name of this role.
     *
     * @attribute
     */
    readonly roleName: string;
    /**
     * Grant the actions defined in actions to the identity Principal on this resource.
     */
    grant(grantee: IPrincipal, ...actions: string[]): Grant;
    /**
     * Grant permissions to the given principal to pass this role.
     */
    grantPassRole(grantee: IPrincipal): Grant;
    /**
     * Grant permissions to the given principal to assume this role.
     */
    grantAssumeRole(grantee: IPrincipal): Grant;
}
/**
 * Options for the `withoutPolicyUpdates()` modifier of a Role
 */
export interface WithoutPolicyUpdatesOptions {
    /**
     * Add grants to resources instead of dropping them
     *
     * If this is `false` or not specified, grant permissions added to this role are ignored.
     * It is your own responsibility to make sure the role has the required permissions.
     *
     * If this is `true`, any grant permissions will be added to the resource instead.
     *
     * @default false
     */
    readonly addGrantsToResources?: boolean;
}

import { IDependable } from "constructs";
import { IOpenIdConnectProvider } from "./oidc-provider";
import { IPolicyDocument } from "./policy-document";
import { PolicyStatement, Condition, Conditions } from "./policy-statement";
import { ISamlProvider } from "./saml-provider";
/**
 * Terraform Principal Props
 *
 * The `principals` and `not_principals` blocks of a policy statement
 *
 * Ref: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/iam_policy_document#principals-and-not_principals
 */
export interface PrincipalProps {
    /**
     * List of identifiers for principals.
     *
     * When type is AWS, these are IAM principal ARNs, e.g., arn:aws:iam::12345678901:role/yak-role.
     *
     * When type is Service, these are AWS Service roles, e.g., lambda.amazonaws.com.
     *
     * When type is Federated, these are web identity users or SAML provider ARNs,
     * e.g., accounts.google.com or arn:aws:iam::12345678901:saml-provider/yak-saml-provider.
     *
     * When type is CanonicalUser, these are canonical user IDs,
     * e.g., 79a59df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47ef2be.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/data-sources/iam_policy_document#identifiers DataAwsIamPolicyDocument#identifiers}
     */
    readonly identifiers: string[];
    /**
     * Type of principal.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/data-sources/iam_policy_document#type DataAwsIamPolicyDocument#type}
     */
    readonly type: PrincipalType;
}
export declare enum PrincipalType {
    AWS = "AWS",
    FEDERATED = "Federated",
    SERVICE = "Service",
    CANONICALUSER = "CanonicalUser",
    ANY = "*"
}
/**
 * Any object that has an associated principal that a permission can be granted to
 */
export interface IGrantable {
    /**
     * The principal to grant permissions to
     */
    readonly grantPrincipal: IPrincipal;
}
/**
 * Represents a logical IAM principal.
 *
 * An IPrincipal describes a logical entity that can perform AWS API calls
 * against sets of resources, optionally under certain conditions.
 *
 * Examples of simple principals are IAM objects that you create, such
 * as Users or Roles.
 *
 * An example of a more complex principals is a `ServicePrincipal` (such as
 * `new ServicePrincipal("sns.amazonaws.com")`, which represents the Simple
 * Notifications Service).
 *
 * A single logical Principal may also map to a set of physical principals.
 * For example, `new OrganizationPrincipal('o-1234')` represents all
 * identities that are part of the given AWS Organization.
 */
export interface IPrincipal extends IGrantable {
    /**
     * When this Principal is used in an AssumeRole policy, the action to use.
     */
    readonly assumeRoleAction: string;
    /**
     * Return the policy fragment that identifies this principal in a Policy.
     */
    readonly policyFragment: PrincipalPolicyFragment;
    /**
     * The AWS account ID of this principal.
     * Can be undefined when the account is not known
     * (for example, for service principals).
     * Can be a Token - in that case,
     * it's assumed to be a reference to the DataAwsCallerIdentity
     */
    readonly principalAccount?: string;
    /**
     * Add to the policy of this principal.
     *
     * @returns true if the statement was added, false if the principal in
     * question does not have a policy document to add the statement to.
     *
     * @deprecated Use `addToPrincipalPolicy` instead.
     */
    addToPolicy(statement: PolicyStatement): boolean;
    /**
     * Add to the policy of this principal.
     */
    addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult;
}
/**
 * A collection of the fields in a PolicyStatement that can be used to identify a principal.
 *
 * This consists of the Terraform PrincipalProps representing the
 * `principals` block(s) in a policy statement.
 *
 * Generally, AWS principal JSON looks like:
 *
 *     { '<TYPE>': ['ID', 'ID', ...] }
 *
 * And this is also the type of the field `principalJson`.
 *
 * However, there is a special type of principal that is just the string '*',
 * which is treated differently by some services.
 *
 * To represent that principal, `principalJson` should contain `*`.
 * To represent that principal in Terraform principals block(s), the
 * type should be `PrincipalType.ANY` and the identifiers should be `['*']`.
 */
export declare class PrincipalPolicyFragment {
    readonly principals: Array<PrincipalProps>;
    /**
     * The conditions under which the policy is in effect.
     * See [the IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html).
     */
    readonly conditions: Conditions;
    /**
     * Parses a JSON object with the AWS IAM Principal structure
     *
     * Refer to the `fromPrincipalJson` and `fromConditionJson` functions for more information
     */
    static fromJson(principalJson: any, conditionsJson?: {
        [key: string]: any;
    }): PrincipalPolicyFragment;
    get principalJson(): AwsPrincipalJson;
    get conditionsJson(): {
        [key: string]: any;
    };
    /**
     *
     * @param principals Array of "principals" block in a policy statement
     * @param conditions conditions that need to be applied to this policy
     */
    constructor(principals: Array<PrincipalProps>, 
    /**
     * The conditions under which the policy is in effect.
     * See [the IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html).
     */
    conditions?: Conditions);
}
/**
 * Typed representation of AWS Principal JSON
 */
export type AwsPrincipalJson = string | {
    [key: string]: string | string[];
};
/**
 * Read from AWS Principal JSON to Terraform principals block(s)
 *
 * Handles special case: if principal is "*" and turns it into the `StarPrincipal`,
 *
 * Even though the IAM Documentation states that "Principal": "*" and "Principal": {"AWS": "*"} are equivalent,
 * those principal elements have different behavior in some situations, e.g., IAM Role Trust Policy.
 *
 * To have Terraform render JSON containing "Principal": "*", use type = "*" and identifiers = ["*"].
 * To have Terraform render JSON containing "Principal": {"AWS": "*"}, use type = "AWS" and identifiers = ["*"].
 */
export declare function fromPrincipalJson(principalJson?: any): PrincipalProps[];
/**
 * Convert Terraform principals blocks back to AWS Principal JSON
 */
export declare function toPrincipalJson(...principalProps: PrincipalProps[]): AwsPrincipalJson;
/**
 * A type of principal that has more control over its own representation in AssumeRolePolicyDocuments
 *
 * More complex types of identity providers need more control over Role's policy documents
 * than simply `{ Effect: 'Allow', Action: 'AssumeRole', Principal: <Whatever> }`.
 *
 * If that control is necessary, they can implement `IAssumeRolePrincipal` to get full
 * access to a Role's AssumeRolePolicyDocument.
 */
export interface IAssumeRolePrincipal extends IPrincipal {
    /**
     * Add the principal to the AssumeRolePolicyDocument
     *
     * Add the statements to the AssumeRolePolicyDocument necessary to give this principal
     * permissions to assume the given role.
     */
    addToAssumeRolePolicy(document: IPolicyDocument): void;
}
/**
 * Result of calling `addToPrincipalPolicy`
 */
export interface AddToPrincipalPolicyResult {
    /**
     * Whether the statement was added to the identity's policies.
     *
     */
    readonly statementAdded: boolean;
    /**
     * Dependable which allows depending on the policy change being applied
     *
     * @default - Required if `statementAdded` is true.
     */
    readonly policyDependable?: IDependable;
}
/**
 * Base class for policy principals
 */
export declare abstract class PrincipalBase implements IAssumeRolePrincipal {
    readonly grantPrincipal: IPrincipal;
    readonly principalAccount: string | undefined;
    /**
     * Return the policy fragment that identifies this principal in a Policy.
     */
    abstract readonly policyFragment: PrincipalPolicyFragment;
    /**
     * When this Principal is used in an AssumeRole policy, the action to use.
     */
    readonly assumeRoleAction: string;
    addToPolicy(statement: PolicyStatement): boolean;
    addToPrincipalPolicy(_statement: PolicyStatement): AddToPrincipalPolicyResult;
    addToAssumeRolePolicy(document: IPolicyDocument): void;
    toString(): string;
    /**
     * JSON-ify the principal
     *
     * Used when JSON.stringify() is called
     */
    toJSON(): AwsPrincipalJson;
    /**
     * Returns a new PrincipalWithConditions using this principal as the base, with the
     * passed conditions added.
     *
     * When there is a value for the same operator and key in both the principal and the
     * conditions parameter, the value from the conditions parameter will be used.
     *
     * @returns a new PrincipalWithConditions object.
     */
    withConditions(...conditions: Conditions): PrincipalBase;
    /**
     * Returns a new principal using this principal as the base, with session tags enabled.
     *
     * @returns a new SessionTagsPrincipal object.
     */
    withSessionTags(): PrincipalBase;
    /**
     * Return whether or not this principal is equal to the given principal
     */
    abstract dedupeString(): string | undefined;
}
/**
 * Specify a principal by the Amazon Resource Name (ARN).
 * You can specify AWS accounts, IAM users, Federated SAML users, IAM roles, and specific assumed-role sessions.
 * You cannot specify IAM groups or instance profiles as principals
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_principal.html
 */
export declare class ArnPrincipal extends PrincipalBase {
    readonly arn: string;
    /**
     *
     * @param arn Amazon Resource Name (ARN) of the principal entity (i.e. arn:aws:iam::123456789012:user/user-name)
     */
    constructor(arn: string);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    /**
     * A convenience method for adding a condition that the principal is part of the specified
     * AWS Organization.
     */
    inOrganization(organizationId: string): PrincipalBase;
    dedupeString(): string | undefined;
}
/**
 * Specify AWS account ID as the principal entity in a policy to delegate authority to the account.
 */
export declare class AccountPrincipal extends ArnPrincipal {
    readonly accountId: any;
    readonly principalAccount: string | undefined;
    /**
     *
     * @param accountId AWS account ID (i.e. '123456789012')
     */
    constructor(accountId: any);
    toString(): string;
}
/**
 * Options for a service principal.
 */
export interface ServicePrincipalOpts {
    /**
     * The region in which you want to reference the service
     *
     * This is only necessary for *cross-region* references.
     *
     * Note: We always return the full service principal name, including the region.
     * Normally, the region is only required for *opt-in* regions. In those
     * cases, the region name needs to be included to reference the correct service principal.
     * In all other cases, the global service principal name is sufficient.
     *
     * @default - the resolving Stack's region.
     */
    readonly region?: string;
    /**
     * Additional conditions to add to the Service Principal
     *
     * @default - No conditions
     */
    readonly conditions?: Conditions;
}
/**
 * An IAM principal that represents an AWS service (i.e. `sqs.amazonaws.com`).
 */
export declare class ServicePrincipal extends PrincipalBase {
    readonly service: string;
    private readonly opts;
    /**
     * Return the service principal name based on the region it's used in.
     *
     * Some service principal names used to be different for different partitions,
     * and some were not.
     *
     * These days all service principal names are standardized, and they are all
     * of the form `<servicename>.amazonaws.com`.
     *
     * To avoid breaking changes, handling is provided for services added with the formats below,
     * however, no additional handling will be added for new regions or partitions.
     *   - s3
     *   - s3.amazonaws.com
     *   - s3.amazonaws.com.cn
     *   - s3.c2s.ic.gov
     *   - s3.sc2s.sgov.gov
     *
     * @example
     * const principalName = iam.ServicePrincipal.servicePrincipalName('ec2');
     */
    static servicePrincipalName(service: string): string;
    /**
     * Reference an AWS service, optionally in a given region
     *
     * @param service AWS service (i.e. sqs.amazonaws.com)
     */
    constructor(service: string, opts?: ServicePrincipalOpts);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    dedupeString(): string | undefined;
}
/**
 * A principal that represents an AWS Organization
 */
export declare class OrganizationPrincipal extends PrincipalBase {
    readonly organizationId: string;
    /**
     *
     * @param organizationId The unique identifier (ID) of an organization (i.e. o-12345abcde)
     */
    constructor(organizationId: string);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    dedupeString(): string | undefined;
}
/**
 * A policy principal for canonicalUserIds - useful for S3 bucket policies that use
 * Origin Access identities.
 *
 * See https://docs.aws.amazon.com/general/latest/gr/acct-identifiers.html
 *
 * and
 *
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html
 *
 * for more details.
 *
 */
export declare class CanonicalUserPrincipal extends PrincipalBase {
    readonly canonicalUserId: string;
    /**
     *
     * @param canonicalUserId unique identifier assigned by AWS for every account.
     *   root user and IAM users for an account all see the same ID.
     *   (i.e. 79a59df900b949e55d96a1e698fbacedfd6e09d98eacf8f8d5218e7cd47ef2be)
     */
    constructor(canonicalUserId: string);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    dedupeString(): string | undefined;
}
/**
 * Principal entity that represents a federated identity provider such as Amazon Cognito,
 * that can be used to provide temporary security credentials to users who have been authenticated.
 * Additional condition keys are available when the temporary security credentials are used to make a request.
 * You can use these keys to write policies that limit the access of federated users.
 *
 * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html#condition-keys-wif
 */
export declare class FederatedPrincipal extends PrincipalBase {
    readonly federated: string;
    readonly assumeRoleAction: string;
    /**
     * The conditions under which the policy is in effect.
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html
     */
    readonly conditions: Conditions;
    /**
     *
     * @param federated federated identity provider (i.e. 'cognito-identity.amazonaws.com' for users authenticated through Cognito)
     * @param sessionTags Whether to enable session tagging (see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html)
     */
    constructor(federated: string, conditions?: Conditions, assumeRoleAction?: string);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    dedupeString(): string | undefined;
}
/**
 * A principal that represents a federated identity provider as Web Identity such as Cognito, Amazon,
 * Facebook, Google, etc.
 */
export declare class WebIdentityPrincipal extends FederatedPrincipal {
    /**
     *
     * @param identityProvider identity provider (i.e. 'cognito-identity.amazonaws.com' for users authenticated through Cognito)
     * @param conditions The conditions under which the policy is in effect.
     *   See [the IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html).
     * @param sessionTags Whether to enable session tagging (see https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html)
     */
    constructor(identityProvider: string, conditions?: Conditions);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
}
/**
 * A principal that represents a federated identity provider as from a OpenID Connect provider.
 */
export declare class OpenIdConnectPrincipal extends WebIdentityPrincipal {
    /**
     *
     * @param openIdConnectProvider OpenID Connect provider
     * @param conditions The conditions under which the policy is in effect.
     *   See [the IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html).
     */
    constructor(openIdConnectProvider: IOpenIdConnectProvider, conditions?: Conditions);
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
}
/**
 * Principal entity that represents a SAML federated identity provider
 */
export declare class SamlPrincipal extends FederatedPrincipal {
    constructor(samlProvider: ISamlProvider, conditions: Conditions);
    toString(): string;
}
/**
 * Principal entity that represents a SAML federated identity provider for
 * programmatic and AWS Management Console access.
 */
export declare class SamlConsolePrincipal extends SamlPrincipal {
    /**
     * enum Partition {
     *   Default = 'aws',
     *   Cn = 'aws-cn',
     *   UsGov = 'aws-us-gov',
     *   UsIso = 'aws-iso',
     *   UsIsoB = 'aws-iso-b',
     *   UsIsoF = 'aws-iso-f',
     *   EuIsoE = 'aws-iso-e',
     * }
     * SAML Sign On urls could be...
     * [Partition.Default]: 'https://signin.aws.amazon.com/saml',
     * [Partition.Cn]: 'https://signin.amazonaws.cn/saml',
     * [Partition.UsGov]: 'https://signin.amazonaws-us-gov.com/saml',
     * [Partition.UsIso]: 'https://signin.c2shome.ic.gov/saml',
     * [Partition.UsIsoB]: 'https://signin.sc2shome.sgov.gov/saml',
     */
    /**
     * @param samlProvider The SAML provider
     */
    constructor(samlProvider: ISamlProvider, conditions?: Conditions);
    toString(): string;
}
/**
 * Use the AWS account into which a stack is deployed as the principal entity in a policy
 */
export declare class AccountRootPrincipal extends AccountPrincipal {
    constructor();
    toString(): string;
}
/**
 * A principal representing all AWS identities in all accounts
 *
 * Some services behave differently when you specify `Principal: '*'`
 * or `Principal: { AWS: "*" }` in their resource policy.
 *
 * `AnyPrincipal` renders to `Principal: { AWS: "*" }`. This is correct
 * most of the time, but in cases where you need the other principal,
 * use `StarPrincipal` instead.
 */
export declare class AnyPrincipal extends ArnPrincipal {
    constructor();
    toString(): string;
}
/**
 * A principal representing all identities in all accounts
 * @deprecated use `AnyPrincipal`
 */
export declare class Anyone extends AnyPrincipal {
}
/**
 * A principal that uses a literal '*' in the IAM JSON language
 *
 * Some services behave differently when you specify `Principal: "*"`
 * or `Principal: { AWS: "*" }` in their resource policy.
 *
 * `StarPrincipal` renders to `Principal: *`. Most of the time, you
 * should use `AnyPrincipal` instead.
 */
export declare class StarPrincipal extends PrincipalBase {
    readonly policyFragment: PrincipalPolicyFragment;
    toString(): string;
    dedupeString(): string | undefined;
}
/**
 * Represents a principal that has multiple types of principals. A composite principal cannot
 * have conditions. i.e. multiple ServicePrincipals that form a composite principal
 */
export declare class CompositePrincipal extends PrincipalBase {
    readonly assumeRoleAction: string;
    private readonly _principals;
    constructor(...principals: IPrincipal[]);
    /**
     * Adds IAM principals to the composite principal. Composite principals cannot have
     * conditions.
     *
     * @param principals IAM principals that will be added to the composite principal
     */
    addPrincipals(...principals: IPrincipal[]): this;
    addToAssumeRolePolicy(doc: IPolicyDocument): void;
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    dedupeString(): string | undefined;
    /**
     * Returns the principals that make up the CompositePrincipal
     */
    get principals(): IPrincipal[];
}
/**
 * Base class for Principals that wrap other principals
 */
declare abstract class PrincipalAdapter extends PrincipalBase {
    protected readonly wrapped: IPrincipal;
    readonly assumeRoleAction: string;
    readonly principalAccount: string | undefined;
    constructor(wrapped: IPrincipal);
    get policyFragment(): PrincipalPolicyFragment;
    addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult;
    /**
     * Append the given string to the wrapped principal's dedupe string (if available)
     */
    protected appendDedupe(append: string): string | undefined;
}
/**
 * Interface for principals that can be compared.
 *
 * This only needs to be implemented for principals that could potentially be value-equal.
 * Identity-equal principals will be handled correctly by default.
 */
export interface IComparablePrincipal extends IPrincipal {
    /**
     * Return a string format of this principal which should be identical if the two
     * principals are the same.
     */
    dedupeString(): string | undefined;
}
/**
 * Helper class for working with `IComparablePrincipal`s
 */
export declare class ComparablePrincipal {
    /**
     * Whether or not the given principal is a comparable principal
     */
    static isComparablePrincipal(x: IPrincipal): x is IComparablePrincipal;
    /**
     * Return the dedupeString of the given principal, if available
     */
    static dedupeStringFor(x: IPrincipal): string | undefined;
}
/**
 * An IAM principal with additional conditions specifying when the policy is in effect.
 *
 * For more information about conditions, see:
 * https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html
 */
export declare class PrincipalWithConditions extends PrincipalAdapter {
    private additionalConditions;
    constructor(principal: IPrincipal, conditions: Conditions);
    addToAssumeRolePolicy(doc: IPolicyDocument): void;
    /**
     * Add a condition to the principal
     */
    addCondition(condition: Condition): void;
    /**
     * Add a conditionObject to the principal
     *
     * A conditionObject has the format of test: { variable: value | values[] }
     *
     * For example:
     *
     * ```ts
     * const condition1 = {'StringEquals', { 'aws:SomeField': '1' }};
     * // or
     * const condition2 = {'StringEquals', { 'aws:SomeField': ['1', '2'] }};
     * ```
     */
    addConditionObject(key: string, value: unknown): void;
    /**
     * Adds multiple conditions to the principal
     *
     * Values from the conditions parameter will overwrite existing values with the same operator
     * and key.
     */
    addConditions(conditions: Conditions): void;
    /**
     * Adds multiple conditionObjects to the principal
     *
     * Values from the conditions parameter will overwrite existing values with the same operator
     * and key.
     */
    addConditionObjects(conditions: {
        [key: string]: unknown;
    }): void;
    /**
     * The conditions under which the policy is in effect.
     * See [the IAM documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements_condition.html).
     */
    get conditions(): Conditions;
    get policyFragment(): PrincipalPolicyFragment;
    toString(): string;
    /**
     * JSON-ify the principal
     *
     * Used when JSON.stringify() is called
     */
    toJSON(): AwsPrincipalJson;
    dedupeString(): string | undefined;
    private mergeConditions;
}
/**
 * Enables session tags on role assumptions from a principal
 *
 * For more information on session tags, see:
 * https://docs.aws.amazon.com/IAM/latest/UserGuide/id_session-tags.html
 */
export declare class SessionTagsPrincipal extends PrincipalAdapter {
    constructor(principal: IPrincipal);
    addToAssumeRolePolicy(doc: IPolicyDocument): void;
    dedupeString(): string | undefined;
}
/**
 * Add a principal to an AssumeRolePolicyDocument in the right way
 *
 * Delegate to the principal if it can do the job itself, do a default job if it can't.
 */
export declare function defaultAddPrincipalToAssumeRole(principal: IPrincipal, doc: IPolicyDocument): void;
/**
 * Merge two arrays that represent IAM principals
 *
 * Does an in-place merge into target.
 */
export declare function mergePrincipal(target: PrincipalProps[], source: PrincipalProps[]): void;
export {};

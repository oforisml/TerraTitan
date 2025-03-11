import { dataAwsIamPolicyDocument } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { PolicyDocumentConfig } from "./policy-document-config.generated";
import { PolicyStatement } from "./policy-statement";
import { AwsConstructBase, IAwsConstruct } from "../aws-construct";
export interface PolicyDocumentOutputs {
    /**
     * The policy document JSON
     */
    readonly policy: any;
}
export interface IPolicyDocument extends IAwsConstruct {
    readonly policyDocumentOutputs: PolicyDocumentOutputs;
    readonly isEmpty: boolean;
    readonly statementCount: number;
    readonly json: string;
    /**
     * Adds a statement to the policy document.
     *
     * @param statement the statement to add.
     */
    addStatements(...statement: PolicyStatement[]): void;
    /**
     * Validate that all policy statements in the policy document satisfies the
     * requirements for any policy.
     *
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#access_policies-json
     *
     * @returns An array of validation error messages, or an empty array if the document is valid.
     */
    validateForAnyPolicy(): string[];
    /**
     * Validate that all policy statements in the policy document satisfies the
     * requirements for a resource-based policy.
     *
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#access_policies-json
     *
     * @returns An array of validation error messages, or an empty array if the document is valid.
     */
    validateForResourcePolicy(): string[] /**
     * Validate that all policy statements in the policy document satisfies the
     * requirements for an identity-based policy.
     *
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#access_policies-json
     *
     * @returns An array of validation error messages, or an empty array if the document is valid.
     */;
    validateForIdentityPolicy(): string[];
    /**
     * Get AWS IAM Policy document JSON
     *
     * NOTE: This may contain unresolved tokens, use spec.resolve() to resolve them.
     */
    toDocumentJson(): any;
}
export interface PolicyDocumentProps extends PolicyDocumentConfig {
    /**
     * Try to minimize the policy by merging statements
     *
     * To avoid overrunning the maximum policy size, combine statements if they produce
     * the same result. Merging happens according to the following rules:
     *
     * - The Effect of both statements is the same
     * - Neither of the statements have a 'Sid'
     * - Combine Principals if the rest of the statement is exactly the same.
     * - Combine Resources if the rest of the statement is exactly the same.
     * - Combine Actions if the rest of the statement is exactly the same.
     * - We will never combine NotPrincipals, NotResources or NotActions, because doing
     *   so would change the meaning of the policy document.
     *
     * @default - false, unless the feature flag `@aws-cdk/aws-iam:minimizePolicies` is set
     */
    readonly minimize?: boolean;
    /**
     * Automatically assign Statement Ids to all statements
     *
     * @default false
     */
    readonly assignSids?: boolean;
}
export declare class PolicyDocument extends AwsConstructBase implements IPolicyDocument {
    /**
     * Creates a new PolicyDocument based on the object provided.
     * This will accept an object created from the `.toDocumentJson()` call
     * @param obj the PolicyDocument in object form.
     */
    static fromJson(scope: Construct, id: string, obj: any): PolicyDocument;
    readonly statements: PolicyStatement[];
    readonly resource: dataAwsIamPolicyDocument.DataAwsIamPolicyDocument;
    get policyDocumentOutputs(): PolicyDocumentOutputs;
    get outputs(): Record<string, any>;
    get json(): string;
    private readonly autoAssignSids;
    private readonly minimize?;
    constructor(scope: Construct, id: string, props?: PolicyDocumentProps);
    /**
     * Perform statement merging (if enabled and not done yet)
     *
     * @internal
     */
    _maybeMergeStatements(): void;
    /**
     * Get AWS IAM Policy document JSON
     *
     * NOTE: May contain tokens, use spec.resolve() to resolve them.
     */
    toDocumentJson(): any;
    /**
     * Whether the policy document contains any statements.
     */
    get isEmpty(): boolean;
    /**
     * The number of statements already added to this policy.
     * Can be used, for example, to generate unique "sid"s within the policy.
     */
    get statementCount(): number;
    /**
     * Adds a statement to the policy document.
     *
     * @param statement the statement to add.
     */
    addStatements(...statement: PolicyStatement[]): void;
    /**
     * Validate that all policy statements in the policy document satisfies the
     * requirements for any policy.
     *
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#access_policies-json
     *
     * @returns An array of validation error messages, or an empty array if the document is valid.
     */
    validateForAnyPolicy(): string[];
    /**
     * Validate that all policy statements in the policy document satisfies the
     * requirements for a resource-based policy.
     *
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#access_policies-json
     *
     * @returns An array of validation error messages, or an empty array if the document is valid.
     */
    validateForResourcePolicy(): string[];
    /**
     * Validate that all policy statements in the policy document satisfies the
     * requirements for an identity-based policy.
     *
     * @see https://docs.aws.amazon.com/IAM/latest/UserGuide/access_policies.html#access_policies-json
     *
     * @returns An array of validation error messages, or an empty array if the document is valid.
     */
    validateForIdentityPolicy(): string[];
}

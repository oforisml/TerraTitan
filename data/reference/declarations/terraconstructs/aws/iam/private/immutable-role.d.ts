import { Construct } from "constructs";
import { AwsConstructBase } from "../../aws-construct";
import { AwsStack } from "../../aws-stack";
import { Grant } from "../grant";
import { IManagedPolicy } from "../managed-policy";
import { Policy } from "../policy";
import { PolicyStatement } from "../policy-statement";
import { AddToPrincipalPolicyResult, IPrincipal, PrincipalPolicyFragment } from "../principals";
import { IRole, RoleOutputs } from "../role";
/**
 * An immutable wrapper around an IRole
 *
 * This wrapper ignores all mutating operations, like attaching policies or
 * adding policy statements.
 *
 * Useful in cases where you want to turn off CDK's automatic permissions
 * management, and instead have full control over all permissions.
 *
 * Note: if you want to ignore all mutations for an externally defined role
 * which was imported into the CDK with `Role.fromRoleArn`, you don't have to use this class -
 * simply pass the property mutable = false when calling `Role.fromRoleArn`.
 */
export declare class ImmutableRole extends AwsConstructBase implements IRole {
    private readonly addGrantsToResources;
    readonly assumeRoleAction: string;
    readonly policyFragment: PrincipalPolicyFragment;
    readonly grantPrincipal: this;
    readonly principalAccount: string | undefined;
    readonly roleArn: string;
    readonly roleName: string;
    readonly stack: AwsStack;
    private readonly _roleOutputs;
    get roleOutputs(): RoleOutputs;
    get outputs(): RoleOutputs;
    private readonly role;
    constructor(scope: Construct, id: string, role: IRole, addGrantsToResources: boolean);
    attachInlinePolicy(_policy: Policy): void;
    addManagedPolicy(_policy: IManagedPolicy): void;
    addToPolicy(statement: PolicyStatement): boolean;
    addToPrincipalPolicy(_statement: PolicyStatement): AddToPrincipalPolicyResult;
    grant(grantee: IPrincipal, ...actions: string[]): Grant;
    grantPassRole(grantee: IPrincipal): Grant;
    grantAssumeRole(identity: IPrincipal): Grant;
}

import { Construct } from "constructs";
import { AwsConstructBase } from "../../aws-construct";
import { Grant } from "../grant";
import { IManagedPolicy } from "../managed-policy";
import { Policy, IPolicy } from "../policy";
import { PolicyStatement } from "../policy-statement";
import { IComparablePrincipal, IPrincipal, AddToPrincipalPolicyResult, PrincipalPolicyFragment } from "../principals";
import { IRole, FromRoleArnOptions, RoleOutputs } from "../role";
export interface ImportedRoleProps extends FromRoleArnOptions {
    readonly roleArn: string;
    readonly roleName: string;
    readonly account?: string;
}
export declare class ImportedRole extends AwsConstructBase implements IRole, IComparablePrincipal {
    readonly grantPrincipal: IPrincipal;
    readonly principalAccount?: string;
    readonly assumeRoleAction: string;
    readonly policyFragment: PrincipalPolicyFragment;
    readonly roleArn: string;
    readonly roleName: string;
    private readonly attachedPolicies;
    private readonly defaultPolicyName?;
    private defaultPolicy?;
    private _roleOutputs;
    get roleOutputs(): RoleOutputs;
    get outputs(): RoleOutputs;
    constructor(scope: Construct, id: string, props: ImportedRoleProps);
    addToPolicy(statement: PolicyStatement): boolean;
    addToPrincipalPolicy(statement: PolicyStatement): AddToPrincipalPolicyResult;
    attachInlinePolicy(policy: Policy): void;
    addManagedPolicy(policy: IManagedPolicy): void;
    grantPassRole(identity: IPrincipal): Grant;
    grantAssumeRole(identity: IPrincipal): Grant;
    grant(grantee: IPrincipal, ...actions: string[]): Grant;
    dedupeString(): string | undefined;
}
/**
 * Helper class that maintains the set of attached policies for a principal.
 */
export declare class AttachedPolicies {
    private policies;
    /**
     * Adds a policy to the list of attached policies.
     *
     * If this policy is already, attached, returns false.
     * If there is another policy attached with the same name, throws an exception.
     */
    attach(policy: IPolicy): void;
}

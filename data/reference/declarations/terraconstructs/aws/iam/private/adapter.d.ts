import { AwsConstructBase } from "../../aws-construct";
import { IPolicyDocument, PolicyDocumentOutputs } from "../policy-document";
import { PolicyStatement } from "../policy-statement";
/**
 * A PolicyDocument adapter that can modify statements flowing through it
 */
export declare class MutatingPolicyDocumentAdapter extends AwsConstructBase implements IPolicyDocument {
    private readonly wrapped;
    private readonly mutator;
    constructor(wrapped: IPolicyDocument, mutator: (s: PolicyStatement) => PolicyStatement);
    get policyDocumentOutputs(): PolicyDocumentOutputs;
    get isEmpty(): boolean;
    get outputs(): Record<string, any>;
    get statementCount(): number;
    get json(): string;
    addStatements(...statements: PolicyStatement[]): void;
    validateForAnyPolicy(): string[];
    validateForIdentityPolicy(): string[];
    validateForResourcePolicy(): string[];
    toDocumentJson(): any;
}

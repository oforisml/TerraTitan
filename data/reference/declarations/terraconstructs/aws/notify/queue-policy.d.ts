import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { IQueue } from "./";
import { PolicyDocument } from "../iam";
/**
 * Properties to associate SQS queues with a policy
 */
export interface QueuePolicyProps extends AwsConstructProps {
    /**
     * The set of queues this policy applies to.
     */
    readonly queue: IQueue;
}
/**
 * The policy for an SQS Queue
 *
 * Policies define the operations that are allowed on this resource.
 *
 * You almost never need to define this construct directly.
 *
 * All AWS resources that support resource policies have a method called
 * `addToResourcePolicy()`, which will automatically create a new resource
 * policy if one doesn't exist yet, otherwise it will add to the existing
 * policy.
 *
 * Prefer to use `addToResourcePolicy()` instead.
 */
export declare class QueuePolicy extends AwsConstructBase {
    /**
     * The IAM policy document for this policy.
     */
    readonly document: PolicyDocument;
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: QueuePolicyProps);
}

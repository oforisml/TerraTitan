import { sfnActivity } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
import * as iam from "../iam";
/**
 * Properties for defining a new Step Functions Activity
 */
export interface ActivityProps extends AwsConstructProps {
    /**
     * The name for this activity.
     *
     * This name must be unique for your AWS account and region for 90 days.
     * For more information, see [Limits Related to State Machine Executions][1] in the AWS Step Functions Developer Guide.
     *
     * To enable logging with CloudWatch Logs, the name should only contain 0-9, A-Z, a-z, - and _.
     * Length Constraints: Minimum length of 1. Maximum length of 80.
     *
     * [1]: https://docs.aws.amazon.com/step-functions/latest/dg/limits.html#service-limits-state-machine-executions
     *
     * @default - If not supplied, a name is generated
     */
    readonly activityName?: string;
}
export interface ActivityOutputs {
    /**
     * The Amazon Resource Name (ARN) that identifies the created activity.
     */
    readonly arn: string;
}
/**
 * Represents a Step Functions Activity
 * https://docs.aws.amazon.com/step-functions/latest/dg/concepts-activities.html
 */
export interface IActivity extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly activityOutputs: ActivityOutputs;
    /**
     * The ARN of the activity
     *
     * @attribute
     */
    readonly activityArn: string;
    /**
     * The name of the activity
     *
     * @attribute
     */
    readonly activityName: string;
}
/**
 * Define a new Step Functions Activity
 */
export declare class Activity extends AwsConstructBase implements IActivity {
    /**
     * Construct an Activity from an existing Activity ARN
     */
    static fromActivityArn(scope: Construct, id: string, activityArn: string): IActivity;
    /**
     * Construct an Activity from an existing Activity Name
     */
    static fromActivityName(scope: Construct, id: string, activityName: string): IActivity;
    get activityOutputs(): ActivityOutputs;
    get outputs(): Record<string, any>;
    readonly resource: sfnActivity.SfnActivity;
    /**
     * @attribute
     */
    readonly activityArn: string;
    /**
     * @attribute
     */
    readonly activityName: string;
    constructor(scope: Construct, id: string, props?: ActivityProps);
    /**
     * Grant the given identity permissions on this Activity
     *
     * @param identity The principal
     * @param actions The list of desired actions
     */
    grant(identity: iam.IGrantable, ...actions: string[]): iam.Grant;
}

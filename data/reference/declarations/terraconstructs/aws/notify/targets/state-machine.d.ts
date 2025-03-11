import * as notify from "..";
import { TargetBaseProps } from "./util";
import * as compute from "../../compute";
import * as iam from "../../iam";
/**
 * Customize the Step Functions State Machine target
 */
export interface SfnStateMachineProps extends TargetBaseProps {
    /**
     * The input to the state machine execution
     *
     * @default the entire EventBridge event
     */
    readonly input?: notify.RuleTargetInput;
    /**
     * The IAM role to be assumed to execute the State Machine
     *
     * @default - a new role will be created
     */
    readonly role?: iam.IRole;
}
/**
 * Use a StepFunctions state machine as a target for Amazon EventBridge rules.
 */
export declare class SfnStateMachine implements notify.IRuleTarget {
    readonly machine: compute.IStateMachine;
    private readonly props;
    private readonly role;
    constructor(machine: compute.IStateMachine, props?: SfnStateMachineProps);
    /**
     * Returns a properties that are used in an Rule to trigger this State Machine
     *
     * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/resource-based-policies-eventbridge.html#sns-permissions
     */
    bind(_rule: notify.IRule, _id?: string): notify.RuleTargetConfig;
}

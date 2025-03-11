import { RuleTargetInput } from "../input";
import { IRule } from "../rule";
import { IRuleTarget, RuleTargetConfig } from "../target";
import { TargetBaseProps } from "./util";
import * as compute from "../../compute";
/**
 * Customize the Lambda Event Target
 */
export interface LambdaFunctionProps extends TargetBaseProps {
    /**
     * The event to send to the Lambda
     *
     * This will be the payload sent to the Lambda Function.
     *
     * @default the entire EventBridge event
     */
    readonly event?: RuleTargetInput;
}
/**
 * Use an AWS Lambda function as an event rule target.
 */
export declare class LambdaFunction implements IRuleTarget {
    private readonly handler;
    private readonly props;
    constructor(handler: compute.IFunction, props?: LambdaFunctionProps);
    /**
     * Returns a RuleTarget that can be used to trigger this Lambda as a
     * result from an EventBridge event.
     */
    bind(rule: IRule, _id?: string): RuleTargetConfig;
}

import { Construct } from "constructs";
import * as cloudwatch from "..";
import * as lambda from "../../compute";
/**
 * Use a Lambda action as an Alarm action
 */
export declare class LambdaAction implements cloudwatch.IAlarmAction {
    private lambdaFunction;
    constructor(lambdaFunction: lambda.IAlias | lambda.IFunction);
    /**
     * Returns an alarm action configuration to use a Lambda action as an alarm action.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_PutMetricAlarm.html
     */
    bind(scope: Construct, alarm: cloudwatch.IAlarm): cloudwatch.AlarmActionConfig;
}

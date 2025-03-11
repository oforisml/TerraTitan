import { IAwsConstruct, AwsConstructBase } from "../aws-construct";
import { IAlarmAction } from "./alarm-action";
/**
 * Interface for Alarm Rule.
 */
export interface IAlarmRule {
    /**
     * serialized representation of Alarm Rule to be used when building the Composite Alarm resource.
     */
    renderAlarmRule(): string;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface AlarmOutputs {
    /**
     * Alarm ARN (i.e. arn:aws:cloudwatch:<region>:<account-id>:alarm:Foo)
     *
     * @attribute
     */
    readonly alarmArn: string;
    /**
     * Name of the alarm
     *
     * @attribute
     */
    readonly alarmName: string;
}
/**
 * Represents a CloudWatch Alarm
 */
export interface IAlarm extends IAlarmRule, IAwsConstruct {
    /** Strongly typed outputs */
    readonly alarmOutputs: AlarmOutputs;
    /**
     * Alarm ARN (i.e. arn:aws:cloudwatch:<region>:<account-id>:alarm:Foo)
     *
     * @attribute
     */
    readonly alarmArn: string;
    /**
     * Name of the alarm
     *
     * @attribute
     */
    readonly alarmName: string;
}
/**
 * The base class for Alarm and CompositeAlarm resources.
 */
export declare abstract class AlarmBase extends AwsConstructBase implements IAlarm {
    /**
     * @attribute
     */
    abstract readonly alarmArn: string;
    abstract readonly alarmName: string;
    get alarmOutputs(): AlarmOutputs;
    get outputs(): Record<string, any>;
    protected alarmActionArns?: string[];
    protected insufficientDataActionArns?: string[];
    protected okActionArns?: string[];
    /**
     * AlarmRule indicating ALARM state for Alarm.
     */
    renderAlarmRule(): string;
    /**
     * Trigger this action if the alarm fires
     *
     * Typically SnsAction or AutoScalingAction.
     */
    addAlarmAction(...actions: IAlarmAction[]): void;
    /**
     * Trigger this action if there is insufficient data to evaluate the alarm
     *
     * Typically SnsAction or AutoScalingAction.
     */
    addInsufficientDataAction(...actions: IAlarmAction[]): void;
    /**
     * Trigger this action if the alarm returns from breaching state into ok state
     *
     * Typically SnsAction or AutoScalingAction.
     */
    addOkAction(...actions: IAlarmAction[]): void;
}

import { cloudwatchEventRule } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
import { Schedule, EventPattern, IRuleTarget, IEventBus, EventCommonOptions } from "./";
export interface RuleProps extends AwsConstructProps, EventCommonOptions {
    /**
     * Indicates whether the rule is enabled.
     *
     * @default true
     */
    readonly enabled?: boolean;
    /**
     * Rule Name prefix to append to Grid UUID
     *
     * Rule names must be made up of only uppercase and lowercase ASCII letters,
     * numbers, underscores, and hyphens, and Due to the length of the tf generated
     * suffix, must be 64 characters or less long.
     *
     *
     * @default - GridUUID + Stack Unique Name
     */
    readonly namePrefix?: string;
    /**
     * The schedule or rate (frequency) that determines when EventBridge
     * runs the rule.
     *
     * You must specify this property, the `eventPattern` property, or both.
     *
     * For more information, see Schedule Expression Syntax for
     * Rules in the Amazon EventBridge User Guide.
     *
     * @see https://docs.aws.amazon.com/eventbridge/latest/userguide/scheduled-events.html
     *
     * @default - None.
     */
    readonly schedule?: Schedule;
    /**
     * Targets to invoke when this rule matches an event.
     *
     * Input will be the full matched event. If you wish to specify custom
     * target input, use `addTarget(target[, inputOptions])`.
     *
     * @default - No targets.
     */
    readonly targets?: IRuleTarget[];
    /**
     * The event bus to associate with this rule.
     *
     * @default - The default event bus.
     */
    readonly eventBus?: IEventBus;
}
export interface RuleOutputs {
    /**
     * Rule name
     */
    readonly name: string;
    /**
     * Rule arn
     */
    readonly arn: string;
}
export interface IRule extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly ruleOutputs: RuleOutputs;
    /**
     * The value of the event rule Amazon Resource Name (ARN), such as
     * arn:aws:events:us-east-2:123456789012:rule/example.
     *
     * @attribute
     */
    readonly ruleArn: string;
    /**
     * The name event rule
     *
     * @attribute
     */
    readonly ruleName: string;
}
export declare class Rule extends AwsConstructBase implements IRule {
    /**
     * Import an existing EventBridge Rule provided an ARN
     *
     * @param scope The parent creating construct (usually `this`).
     * @param id The construct's name.
     * @param eventRuleArn Event Rule ARN (i.e. arn:aws:events:<region>:<account-id>:rule/MyScheduledRule).
     */
    static fromEventRuleArn(scope: Construct, id: string, eventRuleArn: string): IRule;
    readonly resource: cloudwatchEventRule.CloudwatchEventRule;
    get ruleArn(): string;
    get ruleName(): string;
    get ruleOutputs(): RuleOutputs;
    get outputs(): Record<string, any>;
    private readonly targets;
    private readonly eventPattern;
    private readonly scheduleExpression?;
    private readonly description?;
    constructor(scope: Construct, name: string, props?: RuleProps);
    /**
     * Adds an event pattern filter to this rule. If a pattern was already specified,
     * these values are merged into the existing pattern.
     *
     * For example, if the rule already contains the pattern:
     *
     *    {
     *      "resources": [ "r1" ],
     *      "detail": {
     *        "hello": [ 1 ]
     *      }
     *    }
     *
     * And `addEventPattern` is called with the pattern:
     *
     *    {
     *      "resources": [ "r2" ],
     *      "detail": {
     *        "foo": [ "bar" ]
     *      }
     *    }
     *
     * The resulting event pattern will be:
     *
     *    {
     *      "resources": [ "r1", "r2" ],
     *      "detail": {
     *        "hello": [ 1 ],
     *        "foo": [ "bar" ]
     *      }
     *    }
     *
     */
    addEventPattern(eventPattern?: EventPattern): void;
    /**
     * Not private only to be overrideen in CopyRule.
     *
     * @internal
     */
    _renderEventPattern(): any;
    protected validateRule(ruleName?: string): string[];
    /**
     * Adds a target to the rule. The abstract class RuleTarget can be extended to define new
     * targets.
     *
     * No-op if target is undefined.
     */
    addTarget(target?: IRuleTarget): void;
    /**
     * Adds resource to the Terraform JSON output at Synth time.
     *
     * called by TerraformStack.prepareStack()
     */
    toTerraform(): any;
}

import { cloudwatchEventBus, cloudwatchEventPermission } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { Archive, BaseArchiveProps } from "./archive";
import * as iam from "../iam";
/**
 * Outputs to register with the Grid
 */
export interface EventBusOutputs {
    /**
     * The physical ID of this event bus resource
     */
    readonly name: string;
    /**
     * The ARN of this event bus resource
     */
    readonly arn: string;
    /**
     * The partner event source to associate with this event bus resource
     */
    readonly eventSourceName?: string;
}
/**
 * Interface which all EventBus based classes MUST implement
 */
export interface IEventBus extends iam.IAwsConstructWithPolicy {
    /**
     * The physical ID of this event bus resource
     *
     * @attribute
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#cfn-events-eventbus-name
     */
    readonly eventBusName: string;
    /**
     * The ARN of this event bus resource
     *
     * @attribute
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#Arn-fn::getatt
     */
    readonly eventBusArn: string;
    /**
     * The partner event source to associate with this event bus resource
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#cfn-events-eventbus-eventsourcename
     */
    readonly eventSourceName?: string;
    /**
     * Create an EventBridge archive to send events to.
     * When you create an archive, incoming events might not immediately start being sent to the archive.
     * Allow a short period of time for changes to take effect.
     *
     * @param props Properties of the archive
     */
    archive(id: string, props: BaseArchiveProps): Archive;
    /**
     * Grants an IAM Principal to send custom events to the eventBus
     * so that they can be matched to rules.
     *
     * @param grantee The principal (no-op if undefined)
     */
    grantPutEventsTo(grantee: iam.IGrantable): iam.Grant;
}
/**
 * Properties to define an event bus
 */
export interface EventBusProps extends AwsConstructProps {
    /**
     * The name of the event bus you are creating
     * Note: If 'eventSourceName' is passed in, you cannot set this
     *
     * NOTE: the names of custom event buses can't contain the '/' character
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#cfn-events-eventbus-name
     * @default - automatically generated name
     */
    readonly eventBusName?: string;
    /**
     * The partner event source to associate with this event bus resource
     * Note: If 'eventBusName' is passed in, you cannot set this
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#cfn-events-eventbus-eventsourcename
     * @default - no partner event source
     */
    readonly eventSourceName?: string;
}
/**
 * Interface with properties necessary to import a reusable EventBus
 */
export interface EventBusAttributes {
    /**
     * The physical ID of this event bus resource
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#cfn-events-eventbus-name
     */
    readonly eventBusName: string;
    /**
     * The ARN of this event bus resource
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#Arn-fn::getatt
     */
    readonly eventBusArn: string;
    /**
     * The partner event source to associate with this event bus resource
     *
     * @link https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-events-eventbus.html#cfn-events-eventbus-eventsourcename
     * @default - no partner event source
     */
    readonly eventSourceName?: string;
}
declare abstract class EventBusBase extends AwsConstructBase implements IEventBus {
    /**
     * The physical ID of this event bus resource
     */
    abstract readonly eventBusName: string;
    /**
     * The ARN of the event bus, such as:
     * arn:aws:events:us-east-2:123456789012:event-bus/aws.partner/PartnerName/acct1/repo1.
     */
    abstract readonly eventBusArn: string;
    /**
     * The name of the partner event source
     */
    abstract readonly eventSourceName?: string;
    archive(id: string, props: BaseArchiveProps): Archive;
    grantPutEventsTo(grantee: iam.IGrantable): iam.Grant;
    abstract addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult;
}
/**
 * Define an EventBridge EventBus
 *
 * @resource aws_cloudwatch_event_bus
 */
export declare class EventBus extends EventBusBase {
    /**
     * Import an existing event bus resource
     * @param scope Parent construct
     * @param id Construct ID
     * @param eventBusArn ARN of imported event bus
     */
    static fromEventBusArn(scope: Construct, id: string, eventBusArn: string): IEventBus;
    /**
     * Import an existing event bus resource
     * @param scope Parent construct
     * @param id Construct ID
     * @param eventBusName Name of imported event bus
     */
    static fromEventBusName(scope: Construct, id: string, eventBusName: string): IEventBus;
    /**
     * Import an existing event bus resource
     * @param scope Parent construct
     * @param id Construct ID
     * @param attrs Imported event bus properties
     */
    static fromEventBusAttributes(scope: Construct, id: string, attrs: EventBusAttributes): IEventBus;
    /**
     * Permits an IAM Principal to send custom events to EventBridge
     * so that they can be matched to rules.
     *
     * @param grantee The principal (no-op if undefined)
     * @deprecated use grantAllPutEvents instead
     */
    static grantPutEvents(grantee: iam.IGrantable): iam.Grant;
    /**
     * Permits an IAM Principal to send custom events to EventBridge
     * so that they can be matched to rules.
     *
     * @param grantee The principal (no-op if undefined)
     */
    static grantAllPutEvents(grantee: iam.IGrantable): iam.Grant;
    private static eventBusProps;
    readonly resource: cloudwatchEventBus.CloudwatchEventBus;
    readonly eventBusOutputs: EventBusOutputs;
    get outputs(): Record<string, any>;
    private policy?;
    /**
     * The physical ID of this event bus resource
     */
    get eventBusName(): string;
    /**
     * The ARN of the event bus, such as:
     * arn:aws:events:us-east-2:123456789012:event-bus/aws.partner/PartnerName/acct1/repo1.
     */
    get eventBusArn(): string;
    /**
     * The name of the partner event source
     */
    readonly eventSourceName?: string;
    constructor(scope: Construct, id: string, props?: EventBusProps);
    /**
     * Adds a statement to the IAM resource policy associated with this event bus.
     */
    addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult;
}
/**
 * Properties to associate Event Buses with a policy
 */
export interface EventBusPolicyProps extends AwsConstructProps {
    /**
     * The event bus to which the policy applies
     */
    readonly eventBus: IEventBus;
}
/**
 * The policy for an Event Bus
 *
 * Policies define the operations that are allowed on this resource.
 *
 * You almost never need to define this construct directly.
 *
 * The EventBusPolicy resource (`aws_cloudwatch_event_bus_policy`)
 * is incompatible with the EventBridgePermission resource (`aws_cloudwatch_event_permission`)
 * and will overwrite permissions.
 *
 * All AWS resources that support resource policies have a method called
 * `addToResourcePolicy()`, which will automatically create a new resource
 * policy if one doesn't exist yet, otherwise it will add to the existing
 * policy.
 *
 * Prefer to use `addToResourcePolicy()` instead.
 *
 * @resource aws_cloudwatch_event_bus_policy
 */
export declare class EventBusPolicy extends AwsConstructBase {
    /**
     * The IAM policy document for this policy.
     */
    readonly document: iam.PolicyDocument;
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: EventBusPolicyProps);
}
/**
 * Properties to add permissions to an Event Bus
 */
export interface EventBridgePermissionProps extends AwsConstructProps {
    /**
     * The event bus to which the policy applies
     */
    readonly eventBus: IEventBus;
    /**
     * An identifier string for the external account that
     * you are granting permissions to.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/cloudwatch_event_permission#statement_id CloudwatchEventPermission#statement_id}
     */
    readonly statementId: string;
    /**
     * The action that you are enabling the other account to perform. Defaults to events:PutEvents
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/cloudwatch_event_permission#action CloudwatchEventPermission#action}
     * @default "events:PutEvents"
     */
    readonly action?: string;
    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/cloudwatch_event_permission#event_bus_name CloudwatchEventPermission#event_bus_name}
     */
    readonly eventBusName?: string;
    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/cloudwatch_event_permission#id CloudwatchEventPermission#id}
     *
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    readonly id?: string;
    /**
     * The 12-digit AWS account ID that you are permitting to put events to your default event bus.
     * Specify * to permit any account to put events to your default event bus, optionally limited
     * by condition.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/cloudwatch_event_permission#principal CloudwatchEventPermission#principal}
     */
    readonly principal: string;
    /**
     * Configuration block to limit the event bus permissions you are granting to only accounts that
     * fulfill the condition.condition block
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/cloudwatch_event_permission#condition CloudwatchEventPermission#condition}
     */
    readonly condition?: cloudwatchEventPermission.CloudwatchEventPermissionCondition;
}
/**
 * A single permission for an Event Bus
 *
 * All AWS resources that support resource policies have a method called
 * `addToResourcePolicy()`, which will automatically create a new resource
 * policy if one doesn't exist yet, otherwise it will add to the existing
 * policy.
 *
 * If `addToResourcePolicy()` was used on the event bus, The EventBusPolicy resource
 * (`aws_cloudwatch_event_bus_policy`) is incompatible with this resource and
 * will overwrite permissions.
 *
 * @resource aws_cloudwatch_event_permission
 */
export declare class EventBridgePermission extends AwsConstructBase {
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: EventBridgePermissionProps);
}
export {};

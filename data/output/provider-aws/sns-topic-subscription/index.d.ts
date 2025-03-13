/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */
import { Construct } from 'constructs';
import * as cdktf from 'cdktf';
export interface SnsTopicSubscriptionConfig extends cdktf.TerraformMetaArguments {
    /** (Optional) Integer indicating number of minutes to wait in retrying mode for fetching subscription arn before marking it as failure. Only applicable for http and https protocols. Default is `1`. */
    readonly confirmationTimeoutInMinutes?: number;
    /** (Optional) JSON String with the delivery policy (retries, backoff, etc.) that will be used in the subscription - this only applies to HTTP/S subscriptions. Refer to the [SNS docs](https://docs.aws.amazon.com/sns/latest/dg/DeliveryPolicies.html) for more details. */
    readonly deliveryPolicy?: string;
    /** (Required) Endpoint to send data to. The contents vary with the protocol. See details below. */
    readonly endpoint: string;
    /** (Optional) Whether the endpoint is capable of [auto confirming subscription](http://docs.aws.amazon.com/sns/latest/dg/SendMessageToHttp.html#SendMessageToHttp.prepare) (e.g., PagerDuty). Default is `false`. */
    readonly endpointAutoConfirms?: boolean | cdktf.IResolvable;
    /** (Optional) JSON String with the filter policy that will be used in the subscription to filter messages seen by the target resource. Refer to the [SNS docs](https://docs.aws.amazon.com/sns/latest/dg/message-filtering.html) for more details. */
    readonly filterPolicy?: string;
    /** (Optional) Whether the `filterPolicy` applies to `MessageAttributes` (default) or `MessageBody`. */
    readonly filterPolicyScope?: string;
    /**
    * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/sns_topic_subscription#id SnsTopicSubscription#id}
    *
    * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
    * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
    */
    readonly id?: string;
    /** (Required) Protocol to use. Valid values are: `sqs`, `sms`, `lambda`, `firehose`, and `application`. Protocols `email`, `email-json`, `http` and `https` are also valid but partially supported. See details below. */
    readonly protocol: string;
    /** (Optional) Whether to enable raw message delivery (the original message is directly passed, not wrapped in JSON with the original message in the message property). Default is `false`. */
    readonly rawMessageDelivery?: boolean | cdktf.IResolvable;
    /** (Optional) JSON String with the redrive policy that will be used in the subscription. Refer to the [SNS docs](https://docs.aws.amazon.com/sns/latest/dg/sns-dead-letter-queues.html#how-messages-moved-into-dead-letter-queue) for more details. */
    readonly redrivePolicy?: string;
    /** (Optional) JSON String with the archived message replay policy that will be used in the subscription. Refer to the [SNS docs](https://docs.aws.amazon.com/sns/latest/dg/message-archiving-and-replay-subscriber.html) for more details. ### Protocol support Supported values for `protocol` include: */
    readonly replayPolicy?: string;
    /** (Required if `protocol` is `firehose`) ARN of the IAM role to publish to Kinesis Data Firehose delivery stream. Refer to [SNS docs](https://docs.aws.amazon.com/sns/latest/dg/sns-firehose-as-subscriber.html). */
    readonly subscriptionRoleArn?: string;
    /** (Required) ARN of the SNS topic to subscribe to. The following arguments are optional: */
    readonly topicArn: string;
}
/**
* Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/sns_topic_subscription aws_sns_topic_subscription}
*/
export declare class SnsTopicSubscription extends cdktf.TerraformResource {
    static readonly tfResourceType = "aws_sns_topic_subscription";
    /**
    * Generates CDKTF code for importing a SnsTopicSubscription resource upon running "cdktf plan <stack-name>"
    * @param scope The scope in which to define this construct
    * @param importToId The construct id used in the generated config for the SnsTopicSubscription to import
    * @param importFromId The id of the existing SnsTopicSubscription that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/sns_topic_subscription#import import section} in the documentation of this resource for the id to use
    * @param provider? Optional instance of the provider where the SnsTopicSubscription to import is found
    */
    static generateConfigForImport(scope: Construct, importToId: string, importFromId: string, provider?: cdktf.TerraformProvider): cdktf.ImportableResource;
    /**
    * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/sns_topic_subscription aws_sns_topic_subscription} Resource
    *
    * @param scope The scope in which to define this construct
    * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
    * @param options SnsTopicSubscriptionConfig
    */
    constructor(scope: Construct, id: string, config: SnsTopicSubscriptionConfig);
    get arn(): string;
    private _confirmationTimeoutInMinutes?;
    get confirmationTimeoutInMinutes(): number;
    set confirmationTimeoutInMinutes(value: number);
    resetConfirmationTimeoutInMinutes(): void;
    get confirmationTimeoutInMinutesInput(): number | undefined;
    get confirmationWasAuthenticated(): cdktf.IResolvable;
    private _deliveryPolicy?;
    get deliveryPolicy(): string;
    set deliveryPolicy(value: string);
    resetDeliveryPolicy(): void;
    get deliveryPolicyInput(): string | undefined;
    private _endpoint?;
    get endpoint(): string;
    set endpoint(value: string);
    get endpointInput(): string | undefined;
    private _endpointAutoConfirms?;
    get endpointAutoConfirms(): boolean | cdktf.IResolvable;
    set endpointAutoConfirms(value: boolean | cdktf.IResolvable);
    resetEndpointAutoConfirms(): void;
    get endpointAutoConfirmsInput(): boolean | cdktf.IResolvable | undefined;
    private _filterPolicy?;
    get filterPolicy(): string;
    set filterPolicy(value: string);
    resetFilterPolicy(): void;
    get filterPolicyInput(): string | undefined;
    private _filterPolicyScope?;
    get filterPolicyScope(): string;
    set filterPolicyScope(value: string);
    resetFilterPolicyScope(): void;
    get filterPolicyScopeInput(): string | undefined;
    private _id?;
    get id(): string;
    set id(value: string);
    resetId(): void;
    get idInput(): string | undefined;
    get ownerId(): string;
    get pendingConfirmation(): cdktf.IResolvable;
    private _protocol?;
    get protocol(): string;
    set protocol(value: string);
    get protocolInput(): string | undefined;
    private _rawMessageDelivery?;
    get rawMessageDelivery(): boolean | cdktf.IResolvable;
    set rawMessageDelivery(value: boolean | cdktf.IResolvable);
    resetRawMessageDelivery(): void;
    get rawMessageDeliveryInput(): boolean | cdktf.IResolvable | undefined;
    private _redrivePolicy?;
    get redrivePolicy(): string;
    set redrivePolicy(value: string);
    resetRedrivePolicy(): void;
    get redrivePolicyInput(): string | undefined;
    private _replayPolicy?;
    get replayPolicy(): string;
    set replayPolicy(value: string);
    resetReplayPolicy(): void;
    get replayPolicyInput(): string | undefined;
    private _subscriptionRoleArn?;
    get subscriptionRoleArn(): string;
    set subscriptionRoleArn(value: string);
    resetSubscriptionRoleArn(): void;
    get subscriptionRoleArnInput(): string | undefined;
    private _topicArn?;
    get topicArn(): string;
    set topicArn(value: string);
    get topicArnInput(): string | undefined;
    protected synthesizeAttributes(): {
        [name: string]: any;
    };
    protected synthesizeHclAttributes(): {
        [name: string]: any;
    };
}

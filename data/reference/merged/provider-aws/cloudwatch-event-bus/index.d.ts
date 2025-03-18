/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */
import { Construct } from 'constructs';
import * as cdktf from 'cdktf';
export interface CloudwatchEventBusConfig extends cdktf.TerraformMetaArguments {
    /** (Optional) Event bus description. */
    readonly description?: string;
    /** (Optional) Partner event source that the new event bus will be matched with. Must match `name`. */
    readonly eventSourceName?: string;
    /**
    * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_bus#id CloudwatchEventBus#id}
    *
    * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
    * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
    */
    readonly id?: string;
    /** (Optional) Identifier of the AWS KMS customer managed key for EventBridge to use, if you choose to use a customer managed key to encrypt events on this event bus. The identifier can be the key Amazon Resource Name (ARN), KeyId, key alias, or key alias ARN. */
    readonly kmsKeyIdentifier?: string;
    /** (Required) Name of the new event bus. The names of custom event buses can't contain the / character. To create a partner event bus, ensure that the `name` matches the `eventSourceName`. The following arguments are optional: */
    readonly name: string;
    /** (Optional) Map of tags assigned to the resource. If configured with a provider [`defaultTags` configuration block](/docs/providers/aws/index.html#default_tags-configuration-block) present, tags with matching keys will overwrite those defined at the provider-level. */
    readonly tags?: {
        [key: string]: string;
    };
    /**
    * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_bus#tags_all CloudwatchEventBus#tags_all}
    */
    readonly tagsAll?: {
        [key: string]: string;
    };
}
/**
* Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_bus aws_cloudwatch_event_bus}
*/
export declare class CloudwatchEventBus extends cdktf.TerraformResource {
    static readonly tfResourceType = "aws_cloudwatch_event_bus";
    /**
    * Generates CDKTF code for importing a CloudwatchEventBus resource upon running "cdktf plan <stack-name>"
    * @param scope The scope in which to define this construct
    * @param importToId The construct id used in the generated config for the CloudwatchEventBus to import
    * @param importFromId The id of the existing CloudwatchEventBus that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_bus#import import section} in the documentation of this resource for the id to use
    * @param provider? Optional instance of the provider where the CloudwatchEventBus to import is found
    */
    static generateConfigForImport(scope: Construct, importToId: string, importFromId: string, provider?: cdktf.TerraformProvider): cdktf.ImportableResource;
    /**
    * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_bus aws_cloudwatch_event_bus} Resource
    *
    * @param scope The scope in which to define this construct
    * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
    * @param options CloudwatchEventBusConfig
    */
    constructor(scope: Construct, id: string, config: CloudwatchEventBusConfig);
    get arn(): string;
    private _description?;
    get description(): string;
    set description(value: string);
    resetDescription(): void;
    get descriptionInput(): string | undefined;
    private _eventSourceName?;
    get eventSourceName(): string;
    set eventSourceName(value: string);
    resetEventSourceName(): void;
    get eventSourceNameInput(): string | undefined;
    private _id?;
    get id(): string;
    set id(value: string);
    resetId(): void;
    get idInput(): string | undefined;
    private _kmsKeyIdentifier?;
    get kmsKeyIdentifier(): string;
    set kmsKeyIdentifier(value: string);
    resetKmsKeyIdentifier(): void;
    get kmsKeyIdentifierInput(): string | undefined;
    private _name?;
    get name(): string;
    set name(value: string);
    get nameInput(): string | undefined;
    private _tags?;
    get tags(): {
        [key: string]: string;
    };
    set tags(value: {
        [key: string]: string;
    });
    resetTags(): void;
    get tagsInput(): {
        [key: string]: string;
    } | undefined;
    private _tagsAll?;
    get tagsAll(): {
        [key: string]: string;
    };
    set tagsAll(value: {
        [key: string]: string;
    });
    resetTagsAll(): void;
    get tagsAllInput(): {
        [key: string]: string;
    } | undefined;
    protected synthesizeAttributes(): {
        [name: string]: any;
    };
    protected synthesizeHclAttributes(): {
        [name: string]: any;
    };
}

/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */
import { Construct } from 'constructs';
import * as cdktf from 'cdktf';
export interface CloudwatchEventPermissionConfig extends cdktf.TerraformMetaArguments {
    /** (Optional) The action that you are enabling the other account to perform. Defaults to `events:PutEvents`. */
    readonly action?: string;
    /** (Optional) The name of the event bus to set the permissions on. If you omit this, the permissions are set on the `default` event bus. */
    readonly eventBusName?: string;
    /**
    * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_permission#id CloudwatchEventPermission#id}
    *
    * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
    * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
    */
    readonly id?: string;
    /** (Required) The 12-digit AWS account ID that you are permitting to put events to your default event bus. Specify `*` to permit any account to put events to your default event bus, optionally limited by `condition`. */
    readonly principal: string;
    /** (Required) An identifier string for the external account that you are granting permissions to. */
    readonly statementId: string;
    /** (Optional) Configuration block to limit the event bus permissions you are granting to only accounts that fulfill the condition. Specified below. */
    readonly condition?: CloudwatchEventPermissionCondition;
}
export interface CloudwatchEventPermissionCondition {
    /** (Required) Key for the condition. Valid values: `aws:PrincipalOrgID`. */
    readonly key: string;
    /** (Required) Type of condition. Value values: `StringEquals`. */
    readonly type: string;
    /** (Required) Value for the key. */
    readonly value: string;
}
export declare function cloudwatchEventPermissionConditionToTerraform(struct?: CloudwatchEventPermissionConditionOutputReference | CloudwatchEventPermissionCondition): any;
export declare function cloudwatchEventPermissionConditionToHclTerraform(struct?: CloudwatchEventPermissionConditionOutputReference | CloudwatchEventPermissionCondition): any;
export declare class CloudwatchEventPermissionConditionOutputReference extends cdktf.ComplexObject {
    private isEmptyObject;
    /**
    * @param terraformResource The parent resource
    * @param terraformAttribute The attribute on the parent resource this class is referencing
    */
    constructor(terraformResource: cdktf.IInterpolatingParent, terraformAttribute: string);
    get internalValue(): CloudwatchEventPermissionCondition | undefined;
    set internalValue(value: CloudwatchEventPermissionCondition | undefined);
    private _key?;
    get key(): string;
    set key(value: string);
    get keyInput(): string | undefined;
    private _type?;
    get type(): string;
    set type(value: string);
    get typeInput(): string | undefined;
    private _value?;
    get value(): string;
    set value(value: string);
    get valueInput(): string | undefined;
}
/**
* Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_permission aws_cloudwatch_event_permission}
*/
export declare class CloudwatchEventPermission extends cdktf.TerraformResource {
    static readonly tfResourceType = "aws_cloudwatch_event_permission";
    /**
    * Generates CDKTF code for importing a CloudwatchEventPermission resource upon running "cdktf plan <stack-name>"
    * @param scope The scope in which to define this construct
    * @param importToId The construct id used in the generated config for the CloudwatchEventPermission to import
    * @param importFromId The id of the existing CloudwatchEventPermission that should be imported. Refer to the {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_permission#import import section} in the documentation of this resource for the id to use
    * @param provider? Optional instance of the provider where the CloudwatchEventPermission to import is found
    */
    static generateConfigForImport(scope: Construct, importToId: string, importFromId: string, provider?: cdktf.TerraformProvider): cdktf.ImportableResource;
    /**
    * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.88.0/docs/resources/cloudwatch_event_permission aws_cloudwatch_event_permission} Resource
    *
    * @param scope The scope in which to define this construct
    * @param id The scoped construct ID. Must be unique amongst siblings in the same scope
    * @param options CloudwatchEventPermissionConfig
    */
    constructor(scope: Construct, id: string, config: CloudwatchEventPermissionConfig);
    private _action?;
    get action(): string;
    set action(value: string);
    resetAction(): void;
    get actionInput(): string | undefined;
    private _eventBusName?;
    get eventBusName(): string;
    set eventBusName(value: string);
    resetEventBusName(): void;
    get eventBusNameInput(): string | undefined;
    private _id?;
    get id(): string;
    set id(value: string);
    resetId(): void;
    get idInput(): string | undefined;
    private _principal?;
    get principal(): string;
    set principal(value: string);
    get principalInput(): string | undefined;
    private _statementId?;
    get statementId(): string;
    set statementId(value: string);
    get statementIdInput(): string | undefined;
    private _condition;
    get condition(): CloudwatchEventPermissionConditionOutputReference;
    putCondition(value: CloudwatchEventPermissionCondition): void;
    resetCondition(): void;
    get conditionInput(): CloudwatchEventPermissionCondition | undefined;
    protected synthesizeAttributes(): {
        [name: string]: any;
    };
    protected synthesizeHclAttributes(): {
        [name: string]: any;
    };
}

import { sfnStateMachine } from "@cdktf/provider-aws";
import { IResolvable } from "cdktf";
import { Construct } from "constructs";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
import { StateGraph } from "./state-graph";
import { IChainable } from "./types";
import { Duration } from "../../duration";
import * as iam from "../iam";
/**
 * Properties for defining a State Machine
 */
export interface StateMachineProps extends AwsConstructProps {
    /**
     * The name of the state machine.
     *
     * To enable logging with CloudWatch Logs, the name should only contain 0-9, A-Z, a-z, - and _.
     *
     * Length Constraints: Minimum length of 1. Maximum length of 80.
     *
     * @default - Terraform will assign a random, unique suffix.
     */
    readonly stateMachineName?: string;
    /**
     * Creates a unique name beginning with the specified prefix. Conflicts with `stateMachineName`
     *
     * The name should only contain 0-9, A-Z, a-z, - and _
     * Terraform Prefixes must reserve 26 characters for the terraform generated suffix.
     *
     * @default - GridUUID + Stack Unique Name
     */
    readonly namePrefix?: string;
    /**
     * Definition for this state machine
     */
    readonly definitionBody: DefinitionBody;
    /**
     * The execution role for the state machine service
     *
     * @default A role is automatically created
     */
    readonly role?: iam.IRole;
    /**
     * Maximum run time for this state machine
     *
     * @default No timeout
     */
    readonly timeout?: Duration;
    /**
     * Comment that describes this state machine
     *
     * @default - No comment
     */
    readonly comment?: string;
    /**
     * Type of the state machine
     *
     * @default StateMachineType.STANDARD
     */
    readonly stateMachineType?: StateMachineType;
    /**
     * Defines what execution history events are logged and where they are logged.
     *
     * @default No logging
     */
    readonly logs?: LogOptions;
    /**
     * Specifies whether Amazon X-Ray tracing is enabled for this state machine.
     *
     * @default false
     */
    readonly tracingEnabled?: boolean;
    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sfn_state_machine#tags SfnStateMachine#tags}
     */
    readonly tags?: {
        [key: string]: string;
    };
    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sfn_state_machine#publish SfnStateMachine#publish}
     */
    readonly publish?: boolean | IResolvable;
}
export interface StateMachineOutputs {
    /**
     * State Machine arn
     */
    readonly arn: string;
}
/**
 * A State Machine
 */
export interface IStateMachine extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly stateMachineOutputs: StateMachineOutputs;
    /**
     * The ARN of the state machine
     * @attribute
     */
    readonly stateMachineArn: string;
    /**
     * Grant the given identity permissions to start an execution of this state
     * machine.
     *
     * @param identity The principal
     */
    grantStartExecution(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to start a synchronous execution of
     * this state machine.
     *
     * @param identity The principal
     */
    grantStartSyncExecution(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity read permissions for this state machine
     *
     * @param identity The principal
     */
    grantRead(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity read permissions for this state machine
     *
     * @param identity The principal
     */
    grantTaskResponse(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions for all executions of a state machine
     *
     * @param identity The principal
     * @param actions The list of desired actions
     */
    grantExecution(identity: iam.IGrantable, ...actions: string[]): iam.Grant;
    /**
     * Grant the given identity custom permissions
     *
     * @param identity The principal
     * @param actions The list of desired actions
     */
    grant(identity: iam.IGrantable, ...actions: string[]): iam.Grant;
}
/**
 * A new or imported state machine.
 */
declare abstract class StateMachineBase extends AwsConstructBase implements IStateMachine {
    /**
     * Import a state machine
     */
    static fromStateMachineArn(scope: Construct, id: string, stateMachineArn: string): IStateMachine;
    /**
     * Import a state machine via resource name
     */
    static fromStateMachineName(scope: Construct, id: string, stateMachineName: string): IStateMachine;
    abstract readonly stateMachineArn: string;
    get stateMachineOutputs(): StateMachineOutputs;
    get outputs(): Record<string, any>;
    /**
     * The principal this state machine is running as
     */
    abstract readonly grantPrincipal: iam.IPrincipal;
    /**
     * Grant the given identity permissions to start an execution of this state
     * machine.
     */
    grantStartExecution(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to start a synchronous execution of
     * this state machine.
     */
    grantStartSyncExecution(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions to read results from state
     * machine.
     */
    grantRead(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity task response permissions on a state machine
     */
    grantTaskResponse(identity: iam.IGrantable): iam.Grant;
    /**
     * Grant the given identity permissions on all executions of the state machine
     */
    grantExecution(identity: iam.IGrantable, ...actions: string[]): iam.Grant;
    /**
     * Grant the given identity custom permissions
     */
    grant(identity: iam.IGrantable, ...actions: string[]): iam.Grant;
    /**
     * Returns the pattern for the execution ARN's of the state machine
     */
    private executionArn;
}
/**
 * Define a StepFunctions State Machine
 */
export declare class StateMachine extends StateMachineBase {
    /**
     * Execution role of this state machine
     */
    readonly role: iam.IRole;
    readonly resource: sfnStateMachine.SfnStateMachine;
    /**
     * The name of the state machine
     * @attribute
     */
    get stateMachineName(): string;
    /**
     * The ARN of the state machine
     */
    get stateMachineArn(): string;
    /**
     * Type of the state machine
     * @attribute
     */
    readonly stateMachineType: StateMachineType;
    /**
     * Identifier for the state machine revision, which is an immutable, read-only snapshot of a state machine’s definition and configuration.
     * @attribute
     */
    readonly stateMachineRevisionId: string;
    constructor(scope: Construct, id: string, props: StateMachineProps);
    /**
     * The principal this state machine is running as
     */
    get grantPrincipal(): iam.IPrincipal;
    /**
     * Add the given statement to the role's policy
     */
    addToRolePolicy(statement: iam.PolicyStatement): void;
    private validateStateMachineName;
    private buildLoggingConfiguration;
    private buildTracingConfiguration;
}
/**
 * Partial object from the StateMachine L1 construct properties containing definition information
 */
export interface DefinitionConfig {
    readonly definition: string;
}
export declare abstract class DefinitionBody {
    static fromString(definition: string): DefinitionBody;
    static fromChainable(chainable: IChainable): DefinitionBody;
    abstract bind(scope: Construct, sfnPrincipal: iam.IPrincipal, sfnProps: StateMachineProps, graph?: StateGraph): DefinitionConfig;
}
export declare class StringDefinitionBody extends DefinitionBody {
    readonly body: string;
    constructor(body: string);
    bind(_scope: Construct, _sfnPrincipal: iam.IPrincipal, _sfnProps: StateMachineProps, _graph?: StateGraph): DefinitionConfig;
}
export declare class ChainDefinitionBody extends DefinitionBody {
    readonly chainable: IChainable;
    constructor(chainable: IChainable);
    bind(scope: Construct, _sfnPrincipal: iam.IPrincipal, sfnProps: StateMachineProps, graph?: StateGraph): DefinitionConfig;
}
/**
 * Two types of state machines are available in AWS Step Functions: EXPRESS AND STANDARD.
 *
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/concepts-standard-vs-express.html
 *
 * @default STANDARD
 */
export declare enum StateMachineType {
    /**
     * Express Workflows are ideal for high-volume, event processing workloads.
     */
    EXPRESS = "EXPRESS",
    /**
     * Standard Workflows are ideal for long-running, durable, and auditable workflows.
     */
    STANDARD = "STANDARD"
}
/**
 * Defines which category of execution history events are logged.
 *
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/cloudwatch-log-level.html
 *
 * @default ERROR
 */
export declare enum LogLevel {
    /**
     * No Logging
     */
    OFF = "OFF",
    /**
     * Log everything
     */
    ALL = "ALL",
    /**
     * Log all errors
     */
    ERROR = "ERROR",
    /**
     * Log fatal errors
     */
    FATAL = "FATAL"
}
export interface LogOptions {
    /**
     * Determines whether execution data is included in your log.
     *
     * When set to false, data is excluded.
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sfn_state_machine#include_execution_data SfnStateMachine#include_execution_data}
     * @default false
     */
    readonly includeExecutionData?: boolean | IResolvable;
    /**
     * Defines which category of execution history events are logged.
     *
     * @default ERROR
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sfn_state_machine#level SfnStateMachine#level}
     */
    readonly level?: LogLevel;
    /**
     * The log group where the execution history events will be logged.
     *
     * Amazon Resource Name (ARN) of a CloudWatch log group.
     * Make sure the State Machine has the correct IAM policies for logging.
     * The ARN must end with `:*`
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/sfn_state_machine#log_destination SfnStateMachine#log_destination}
     */
    readonly logDestination?: string;
}
export {};

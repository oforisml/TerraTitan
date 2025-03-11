import { Construct } from "constructs";
import { State } from "./state";
import { Duration } from "../../..";
import { Chain } from "../chain";
import { StateGraph } from "../state-graph";
import { IStepFunctionsTask } from "../step-functions-task";
import { CatchProps, IChainable, INextable, RetryProps } from "../types";
/**
 * Props that are common to all tasks
 */
export interface TaskProps {
    /**
     * Actual task to be invoked in this workflow
     */
    readonly task: IStepFunctionsTask;
    /**
     * Optional name for this state
     *
     * @default - The construct ID will be used as state name
     */
    readonly stateName?: string;
    /**
     * An optional description for this state
     *
     * @default No comment
     */
    readonly comment?: string;
    /**
     * JSONPath expression to select part of the state to be the input to this state.
     *
     * May also be the special value JsonPath.DISCARD, which will cause the effective
     * input to be the empty object {}.
     *
     * @default $
     */
    readonly inputPath?: string;
    /**
     * JSONPath expression to select part of the state to be the output to this state.
     *
     * May also be the special value JsonPath.DISCARD, which will cause the effective
     * output to be the empty object {}.
     *
     * @default $
     */
    readonly outputPath?: string;
    /**
     * JSONPath expression to indicate where to inject the state's output
     *
     * May also be the special value JsonPath.DISCARD, which will cause the state's
     * input to become its output.
     *
     * @default $
     */
    readonly resultPath?: string;
    /**
     * Parameters to invoke the task with
     *
     * It is not recommended to use this field. The object that is passed in
     * the `task` property will take care of returning the right values for the
     * `Parameters` field in the Step Functions definition.
     *
     * The various classes that implement `IStepFunctionsTask` will take a
     * properties which make sense for the task type. For example, for
     * `InvokeFunction` the field that populates the `parameters` field will be
     * called `payload`, and for the `PublishToTopic` the `parameters` field
     * will be populated via a combination of the referenced topic, subject and
     * message.
     *
     * If passed anyway, the keys in this map will override the parameters
     * returned by the task object.
     *
     * @see
     * https://docs.aws.amazon.com/step-functions/latest/dg/input-output-inputpath-params.html#input-output-parameters
     *
     * @default - Use the parameters implied by the `task` property
     */
    readonly parameters?: {
        [name: string]: any;
    };
    /**
     * Maximum run time of this state
     *
     * If the state takes longer than this amount of time to complete, a 'Timeout' error is raised.
     *
     * @default 60
     */
    readonly timeout?: Duration;
}
/**
 * Define a Task state in the state machine
 *
 * Reaching a Task state causes some work to be executed, represented by the
 * Task's resource property. Task constructs represent a generic Amazon
 * States Language Task.
 *
 * For some resource types, more specific subclasses of Task may be available
 * which are more convenient to use.
 */
export declare class Task extends State implements INextable {
    readonly endStates: INextable[];
    private readonly timeout?;
    private readonly taskProps;
    constructor(scope: Construct, id: string, props: TaskProps);
    /**
     * Add retry configuration for this state
     *
     * This controls if and how the execution will be retried if a particular
     * error occurs.
     */
    addRetry(props?: RetryProps): Task;
    /**
     * Add a recovery handler for this state
     *
     * When a particular error occurs, execution will continue at the error
     * handler instead of failing the state machine execution.
     */
    addCatch(handler: IChainable, props?: CatchProps): Task;
    /**
     * Continue normal execution with the given state
     */
    next(next: IChainable): Chain;
    /**
     * Return the Amazon States Language object for this state
     */
    toStateJson(): object;
    protected whenBoundToGraph(graph: StateGraph): void;
}

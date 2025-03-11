import { cloudwatchLogStream } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { IAwsConstruct, AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { ILogGroup } from "./log-group";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface LogStreamOutputs {
    /**
     * The name of this log stream
     * @attribute
     */
    readonly logStreamName: string;
}
export interface ILogStream extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly logStreamOutputs: LogStreamOutputs;
    /**
     * The name of this log stream
     * @attribute
     */
    readonly logStreamName: string;
}
/**
 * Properties for a LogStream
 */
export interface LogStreamProps extends AwsConstructProps {
    /**
     * The log group to create a log stream for.
     */
    readonly logGroup: ILogGroup;
    /**
     * The name of the log stream to create.
     *
     * The name must be unique within the log group.
     *
     * @default Automatically generated
     */
    readonly logStreamName?: string;
}
/**
 * Define a Log Stream in a Log Group
 */
export declare class LogStream extends AwsConstructBase implements ILogStream {
    /**
     * Import an existing LogGroup
     */
    static fromLogStreamName(scope: Construct, id: string, logStreamName: string): ILogStream;
    readonly resource: cloudwatchLogStream.CloudwatchLogStream;
    /**
     * The name of this log stream
     */
    readonly logStreamName: string;
    get logStreamOutputs(): LogStreamOutputs;
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: LogStreamProps);
}

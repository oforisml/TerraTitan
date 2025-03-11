import { cloudwatchEventArchive } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AwsConstructBase, AwsConstructProps } from "../aws-construct";
import { IEventBus } from "./event-bus";
import { EventPattern } from "./event-pattern";
import { Duration } from "../..";
/**
 * Outputs which can be exposed through the grid
 */
export interface ArchiveOutputs {
    /**
     * The ARN of the archive created.
     */
    readonly arn: string;
    /**
     * The archive name.
     */
    readonly name: string;
}
/**
 * The event archive base properties
 */
export interface BaseArchiveProps extends AwsConstructProps {
    /**
     * The name of the archive.
     *
     * https://docs.aws.amazon.com/eventbridge/latest/APIReference/API_CreateArchive.html#eventbridge-CreateArchive-request-ArchiveName
     *
     * @default - Automatically generated
     */
    readonly archiveName?: string;
    /**
     * A description for the archive.
     *
     * @default - none
     */
    readonly description?: string;
    /**
     * An event pattern to use to filter events sent to the archive.
     */
    readonly eventPattern: EventPattern;
    /**
     * The number of days to retain events for. Default value is 0. If set to 0, events are retained indefinitely.
     * @default - Infinite
     */
    readonly retention?: Duration;
}
/**
 * The event archive properties
 */
export interface ArchiveProps extends BaseArchiveProps {
    /**
     * The event source associated with the archive.
     */
    readonly sourceEventBus: IEventBus;
}
/**
 * Define an EventBridge Archive
 *
 * @resource aws_cloudwatch_event_archive
 */
export declare class Archive extends AwsConstructBase {
    resource: cloudwatchEventArchive.CloudwatchEventArchive;
    /**
     * The archive name.
     * @attribute
     */
    get archiveName(): string;
    /**
     * The ARN of the archive created.
     * @attribute
     */
    get archiveArn(): string;
    readonly archiveOutputs: ArchiveOutputs;
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: ArchiveProps);
}

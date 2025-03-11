import { Construct } from "constructs";
import * as compute from "../";
import * as notify from "../../notify";
/**
 * Use an Event Bridge event bus as a Lambda destination.
 *
 * If no event bus is specified, the default event bus is used.
 */
export declare class EventBridgeDestination implements compute.IDestination {
    private readonly eventBus?;
    /**
     * @default - use the default event bus
     */
    constructor(eventBus?: notify.IEventBus | undefined);
    /**
     * Returns a destination configuration
     */
    bind(_scope: Construct, fn: compute.IFunction, _options?: compute.DestinationOptions): compute.DestinationConfig;
}

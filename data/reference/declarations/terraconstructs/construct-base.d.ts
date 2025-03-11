import { TerraformResource, TerraformElement, TerraformMetaArguments, IAspect } from "cdktf";
import { Construct, IConstruct } from "constructs";
export interface TerraConstructProps extends TerraformMetaArguments {
    /**
     * The friendly name for TerraConstruct resources
     *
     * @default - `environmentName-id`
     */
    readonly friendlyName?: string;
    /**
     * Whether to register Terraform outputs for this TerraConstruct
     *
     * @default false
     */
    readonly registerOutputs?: boolean;
    /**
     * Optional override for the outputs name
     *
     * @default id
     */
    readonly outputName?: string;
}
export interface ITerraConstruct extends IConstruct {
    /**
     * Environment Name passed in from the CLI
     */
    readonly environmentName: string;
    readonly gridUUID: string;
    readonly outputs: Record<string, any>;
}
export type TaggableConstruct = TerraformResource & {
    tags?: {
        [key: string]: string;
    };
    tagsInput?: {
        [key: string]: string;
    };
};
export declare function isTaggableTerraformResource(x: IConstruct): x is TaggableConstruct;
export declare class GridTags implements IAspect {
    private tagsToAdd;
    constructor(tagsToAdd: Record<string, string>);
    visit(node: IConstruct): void;
}
/**
 * Base class for all TerraConstructs
 *
 * Allows a TerraConstruct to lazily register its outputs with its parent Stack
 */
export declare abstract class TerraConstructBase extends TerraformElement implements ITerraConstruct {
    private readonly constructId;
    /**
     * Returns true if the construct was created by CDKTF, and false otherwise
     */
    static isOwnedResource(construct: IConstruct): boolean;
    /**
     * The name under which the outputs are registered in the parent Scope
     */
    readonly outputName: string;
    /**
     * TerraConstruct friendly name
     */
    readonly friendlyName: string;
    /**
     * TerraConstruct unique grid identifier
     */
    get gridUUID(): string;
    /**
     * Environment Name passed in from the CLI
     */
    get environmentName(): string;
    /**
     * Outputs to register with the parent Scope or undefined if there are no outputs
     */
    abstract get outputs(): Record<string, any>;
    constructor(scope: Construct, constructId: string, props?: TerraConstructProps);
    get fqn(): string;
}

import { IAspect } from "cdktf";
import { IConstruct } from "constructs";
import { TaggableConstruct } from "../construct-base";
/**
 * TaggableConstruct is a Construct that can have tags
 */
export declare function isTaggableConstruct(x: IConstruct): x is TaggableConstruct;
/**
 * Properties for a tag
 */
export interface TagProps {
    /**
     * An array of Resource Types that will not receive this tag
     *
     * An empty array will allow this tag to be applied to all resources. A
     * non-empty array will apply this tag only if the Resource type is not in
     * this array.
     * @default []
     */
    readonly excludeResourceTypes?: string[];
    /**
     * An array of Resource Types that will receive this tag
     *
     * An empty array will match any Resource. A non-empty array will apply this
     * tag only to Resource types that are included in this array.
     * @default []
     */
    readonly includeResourceTypes?: string[];
}
/**
 * CDKTF Aspect adding a single Key/Value Tag to all resources within a construct scope
 *
 * Add tags using `Tags.of(scope).add(key, value)`
 */
export declare class AwsTag implements IAspect {
    private key;
    private value;
    private readonly props;
    constructor(key: string, value: string, props?: TagProps);
    visit(node: IConstruct): void;
    private applyTagAspectHere;
}
/**
 * Manages AWS tags for all resources within a construct scope.
 */
export declare class Tags {
    private readonly scope;
    /**
     * Returns the tags API for this scope.
     * @param scope The scope
     */
    static of(scope: IConstruct): Tags;
    private constructor();
    /**
     * add tags to the node of a construct and all its the taggable children
     */
    add(key: string, value: string, props?: TagProps): void;
}

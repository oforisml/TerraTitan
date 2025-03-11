import { UniqueResourceNameOptions, UniqueResourceNamePrefixOptions } from "../stack-base";
/**
 * Use path hash to generate a unique id from the set of components.
 */
export declare function makeUniqueResourceName(components: string[], options: UniqueResourceNameOptions): string;
/**
 * Does not use Path Hash and relies on provider generated suffix instead
 */
export declare function makeUniqueResourceNamePrefix(components: string[], options: UniqueResourceNamePrefixOptions): string;

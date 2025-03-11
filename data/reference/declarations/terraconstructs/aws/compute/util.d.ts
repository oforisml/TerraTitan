import { Construct } from "constructs";
import { Alias, AliasOptions } from "./function-alias";
import { IFunction } from "./function-base";
export declare function addAlias(scope: Construct, lambda: IFunction, version: string, aliasName: string, options?: AliasOptions): Alias;
/**
 * Map a function over an array and concatenate the results
 */
export declare function flatMap<T, U>(xs: T[], fn: (x: T, i: number) => U[]): U[];
/**
 * Flatten a list of lists into a list of elements
 */
export declare function flatten<A>(xs: A[][]): A[];

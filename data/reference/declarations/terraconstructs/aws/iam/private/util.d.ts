import { IPostProcessor, IResolvable, IResolveContext } from "cdktf";
import { IPolicy } from "../policy";
export declare const MAX_POLICY_NAME_LEN = 128;
export declare function undefinedIfEmpty(f: () => string[]): string[];
/**
 * Helper class that maintains the set of attached policies for a principal.
 */
export declare class AttachedPolicies {
    private policies;
    /**
     * Adds a policy to the list of attached policies.
     *
     * If this policy is already, attached, returns false.
     * If there is another policy attached with the same name, throws an exception.
     */
    attach(policy: IPolicy): void;
}
/**
 * Lazy string set token that dedupes entries
 *
 * Needs to operate post-resolve, because the inputs could be
 * `[ '${Token[TOKEN.9]}', '${Token[TOKEN.10]}', '${Token[TOKEN.20]}' ]`, which
 * still all resolve to the same string value.
 *
 * Needs to JSON.stringify() results because strings could resolve to literal
 * strings but could also resolve to `${index(...)}`.
 */
export declare class UniqueStringSet implements IResolvable, IPostProcessor {
    private readonly fn;
    static from(fn: () => string[]): string[];
    readonly creationStack: string[];
    private constructor();
    resolve(context: IResolveContext): string[];
    postProcess(input: any, _context: IResolveContext): any;
    toString(): string;
}
export declare function sum(xs: number[]): number;

/**
 * An enum-like class that represents the result of comparing two Tokens.
 * The return type of `Token.compareStrings`.
 */
export declare class TokenComparison {
    /**
     * This means we're certain the two components are NOT
     * Tokens, and identical.
     */
    static readonly SAME: TokenComparison;
    /**
     * This means we're certain the two components are NOT
     * Tokens, and different.
     */
    static readonly DIFFERENT: TokenComparison;
    /** This means exactly one of the components is a Token. */
    static readonly ONE_UNRESOLVED: TokenComparison;
    /** This means both components are Tokens. */
    static readonly BOTH_UNRESOLVED: TokenComparison;
    private constructor();
}
/** Compare two strings that might contain Tokens with each other. */
export declare function tokenCompareStrings(possibleToken1: string, possibleToken2: string): TokenComparison;
/**
 * Call the given function only if all given values are resolved
 *
 * Exported as a function since it will be used by TypeScript modules, but
 * can't be exposed via JSII because of the generics.
 */
export declare function withResolved<A>(a: A, fn: (a: A) => void): void;
export declare function withResolved<A, B>(a: A, b: B, fn: (a: A, b: B) => void): void;
export declare function withResolved<A, B, C>(a: A, b: B, c: C, fn: (a: A, b: B, c: C) => void): void;

import { IResolvable, IResolveContext, IPostProcessor } from "cdktf";
/**
 * A Token object that will drop the last element of an array if it is an empty object
 *
 * Necessary to prevent options objects that only contain "region" and "account" keys
 * that evaluate to "undefined" from showing up in the rendered JSON.
 */
export declare class DropEmptyObjectAtTheEndOfAnArray implements IResolvable, IPostProcessor {
    private readonly value;
    readonly creationStack: string[];
    constructor(value: any);
    resolve(context: IResolveContext): any;
    postProcess(o: any, _context: IResolveContext): any;
}

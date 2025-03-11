import { IPostProcessor, IResolveContext } from "cdktf";
/**
 * A Token postprocesser for policy documents
 *
 * Removes duplicate statements, and assign Sids if necessary
 *
 * Because policy documents can contain all kinds of crazy things,
 * we do all the necessary work here after the document has been mostly resolved
 * into a predictable Terraform form.
 */
export declare class PostProcessPolicyDocument implements IPostProcessor {
    private readonly autoAssignSids;
    constructor(autoAssignSids: boolean);
    postProcess(input: any, _context: IResolveContext): any;
}

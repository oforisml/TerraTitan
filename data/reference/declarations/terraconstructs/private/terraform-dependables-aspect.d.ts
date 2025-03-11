import { IAspect } from "cdktf";
import { IConstruct } from "constructs";
export declare const SKIP_DEPENDENCY_PROPAGATION: unique symbol;
/**
 * Aspect that maps construct-level dependencies to the CDKTF dependsOn
 * array of terraform datasources and resources.
 *
 * This Aspect propagates dependencies assigned from parent scopes all the way down
 * to each child resource.
 *
 * ref:
 * - https://github.com/hashicorp/terraform-cdk/issues/2727#issuecomment-1473321075
 * - https://github.com/hashicorp/terraform-cdk/issues/785
 * - https://github.com/winglang/wing/issues/3225
 */
export declare class TerraformDependencyAspect implements IAspect {
    private resourceCache;
    private dependencyCache;
    visit(c: IConstruct): void;
}

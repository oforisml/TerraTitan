import { Construct } from "constructs";
/**
 * Create singleton TerraformLocal expression which determines if a security group allows all outbound traffic
 *
 * @internal
 */
export declare function allowAllOutboundLocal(scope: Construct, id: string, securityGroupId: string): boolean | undefined;

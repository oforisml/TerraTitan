import { cloudfrontOriginAccessIdentity } from "@cdktf/provider-aws";
import { ITerraformDependable } from "cdktf";
import { Construct } from "constructs";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
import { IPrincipal, IGrantable } from "../iam";
export interface OriginAccessIdentityProps extends AwsConstructProps {
    /**
     * A comment to describe the origin access identity.
     */
    readonly comment?: string;
}
/**
 * Interface for CloudFront OriginAccessIdentity
 */
export interface IOriginAccessIdentity extends IAwsConstruct, IGrantable {
    /**
     * The Origin Access Identity Id (physical id)
     */
    readonly originAccessIdentityId: string;
    /**
     * A shortcut to the full path for the origin access identity to use in CloudFront.
     *
     * Example: `origin-access-identity/cloudfront/E2QWRUHAPOMQZL`.
     */
    readonly cloudFrontOriginAccessIdentityPath: string;
    /**
     * Pre-generated ARN for use in S3 bucket policies.
     *
     * Example: `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity E2QWRUHAPOMQZL`.
     */
    readonly iamArn: string;
}
declare abstract class OriginAccessIdentityBase extends AwsConstructBase {
    /**
     * Resource to depend on to make sure the OriginAccessIdentity is created before using it.
     */
    abstract readonly resource: ITerraformDependable;
    /**
     * The Origin Access Identity Id (physical id)
     */
    abstract readonly originAccessIdentityId: string;
    /**
     * A shortcut to the full path for the origin access identity to use in CloudFront.
     */
    abstract readonly cloudFrontOriginAccessIdentityPath: string;
    /**
     * Derived principal value for bucket access
     */
    abstract readonly grantPrincipal: IPrincipal;
    abstract readonly iamArn: string;
    get outputs(): Record<string, any>;
}
/**
 * An origin access identity is a special CloudFront user that you can
 * associate with Amazon S3 origins, so that you can secure all or just some of
 * your Amazon S3 content.
 */
export declare class OriginAccessIdentity extends OriginAccessIdentityBase implements IOriginAccessIdentity {
    /**
     * Creates a OriginAccessIdentity by providing the OriginAccessIdentityId.
     */
    static fromOriginAccessIdentityId(scope: Construct, id: string, originAccessIdentityId: string): IOriginAccessIdentity;
    /**
     * The Origin Access Identity Id (physical id)
     *
     * @attribute
     */
    readonly originAccessIdentityId: string;
    /**
     * A shortcut to the full path for the origin access identity to use in CloudFront.
     *
     * @attribute
     */
    readonly cloudFrontOriginAccessIdentityPath: string;
    /**
     * Pre-generated ARN for use in S3 bucket policies.
     *
     * @attribute
     */
    readonly iamArn: string;
    /**
     * Derived principal value for bucket access
     */
    readonly grantPrincipal: IPrincipal;
    /**
     * CDKTF L1 resource
     */
    readonly resource: cloudfrontOriginAccessIdentity.CloudfrontOriginAccessIdentity;
    constructor(scope: Construct, id: string, props?: OriginAccessIdentityProps);
}
export {};

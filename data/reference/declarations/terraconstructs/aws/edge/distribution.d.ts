import { IResolvable } from "cdktf";
import { Construct } from "constructs";
import { ICertificate, IOrigin, FunctionAssociation } from ".";
import { Duration } from "../../duration";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
import { IResponseHeadersPolicy, ManagedResponseHeadersPolicy } from "./response-headers-policy";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface DistributionOutputs {
    /**
     * Identifier for the distribution. For example: `EDFDVBD632BHDS5`.
     */
    readonly id: string;
    /**
     * CloudFront Route 53 zone ID that can be used to
     * route an Alias Resource Record Set to.
     *
     * This attribute is simply an alias for the zone ID
     */
    readonly hostedZoneId: string;
    /**
     * Current status of the distribution.
     *
     * `Deployed` if the distribution's information is fully propagated
     * throughout the Amazon CloudFront system.
     */
    readonly status: string;
    /**
     * ARN for the distribution
     */
    readonly arn: string;
    /**
     * Domain name corresponding to the distribution.
     *
     * For example: `d604721fxaaqy9.cloudfront.net`
     */
    readonly domainName: string;
}
/**
 * Imported or created DNS zone attributes
 */
export interface IDistribution extends IAwsConstruct {
    /** Strongly typed outputs
     *
     * @attribute
     */
    readonly distributionOutputs: DistributionOutputs;
    /**
     * Domain name corresponding to the distribution.
     *
     * @attribute
     * For example: `d604721fxaaqy9.cloudfront.net`
     */
    readonly domainName: string;
    /**
     * CloudFront Route 53 zone ID that can be used to
     * route an Alias Resource Record Set to.
     *
     * This attribute is simply an alias for the zone ID
     */
    readonly hostedZoneId: string;
}
/**
 * Properties for a Distribution
 */
export interface DistributionProps extends AwsConstructProps {
    /**
     * Extra CNAMEs (alternate domain names), if any, for this distribution.
     */
    readonly aliases?: string[];
    /**
     * Whether the distribution is enabled to accept end user requests for content.
     *
     * @default true
     */
    readonly enabled?: boolean | IResolvable;
    /**
     * If enabled, the resource will wait for the distribution status to change
     * from InProgress to Deployed.
     *
     * Setting this tofalse will skip the process.
     *
     * @default: true.
     */
    readonly waitForDeployment?: boolean;
    /**
     * The default behavior for the distribution.
     */
    readonly defaultBehavior: BehaviorOptions;
    /**
     * Additional behaviors for the distribution, mapped by the pathPattern that specifies which requests to apply the behavior to.
     *
     * @default - no additional behaviors are added.
     */
    readonly additionalBehaviors?: Record<string, BehaviorOptions>;
    /**
     * A certificate to associate with the distribution. The certificate must be located in N. Virginia (us-east-1).
     *
     * @default - the CloudFront wildcard certificate (*.cloudfront.net) will be used.
     */
    readonly certificate?: ICertificate;
    /**
     * Any comments you want to include about the distribution.
     *
     * @default - no comment
     */
    readonly comment?: string;
    /**
     * The object that you want CloudFront to request from your origin (for example, index.html)
     * when a viewer requests the root URL for your distribution. If no default object is set, the
     * request goes to the origin's root (e.g., example.com/).
     *
     * @default - no default root object
     */
    readonly defaultRootObject?: string;
    /**
     * Controls the countries in which your content is distributed.
     *
     * @default - No geographic restrictions
     */
    readonly geoRestriction?: GeoRestriction;
    /**
     * Specify the maximum HTTP version that you want viewers to use to communicate with CloudFront.
     *
     * For viewers and CloudFront to use HTTP/2, viewers must support TLS 1.2 or later, and must support server name identification (SNI).
     *
     * @default HttpVersion.HTTP2
     */
    readonly httpVersion?: HttpVersion;
    /**
     * The price class that corresponds with the maximum price that you want to pay for CloudFront service.
     * If you specify PriceClass_All, CloudFront responds to requests for your objects from all CloudFront edge locations.
     * If you specify a price class other than PriceClass_All, CloudFront serves your objects from the CloudFront edge location
     * that has the lowest latency among the edge locations in your price class.
     *
     * @default PriceClass.PRICE_CLASS_ALL
     */
    readonly priceClass?: PriceClass;
    /**
     * How CloudFront should handle requests that are not successful (e.g., PageNotFound).
     *
     * @default - No custom error responses.
     */
    readonly errorResponses?: ErrorResponse[];
    /**
     * The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections.
     *
     * CloudFront serves your objects only to browsers or devices that support at
     * least the SSL version that you specify.
     *
     * @default - SecurityPolicyProtocol.TLS_V1_2_2021.
     */
    readonly minimumProtocolVersion?: SecurityPolicyProtocol;
    /**
     * The SSL method CloudFront will use for your distribution.
     *
     * Server Name Indication (SNI) - is an extension to the TLS computer networking protocol by which a client indicates
     * which hostname it is attempting to connect to at the start of the handshaking process. This allows a server to present
     * multiple certificates on the same IP address and TCP port number and hence allows multiple secure (HTTPS) websites
     * (or any other service over TLS) to be served by the same IP address without requiring all those sites to use the same certificate.
     *
     * CloudFront can use SNI to host multiple distributions on the same IP - which a large majority of clients will support.
     *
     * If your clients cannot support SNI however - CloudFront can use dedicated IPs for your distribution - but there is a prorated monthly charge for
     * using this feature. By default, we use SNI - but you can optionally enable dedicated IPs (VIP).
     *
     * See the CloudFront SSL for more details about pricing : https://aws.amazon.com/cloudfront/custom-ssl-domains/
     *
     * @default SSLMethod.SNI
     */
    readonly sslSupportMethod?: SSLMethod;
}
/**
 * Amazon Cloudfront Distribution
 */
export declare class Distribution extends AwsConstructBase implements IDistribution {
    private readonly resource;
    private readonly _outputs;
    get distributionOutputs(): DistributionOutputs;
    get outputs(): Record<string, any>;
    private readonly _domainName;
    get domainName(): string;
    readonly hostedZoneId: string;
    private readonly _origins;
    private readonly additionalBehaviors;
    private readonly errorResponses;
    private readonly certificate?;
    constructor(scope: Construct, name: string, props: DistributionProps);
    /**
     * Add an Origin to this Distribution.
     *
     * @param origin The Origin to add.
     * @param originId An optional id to use for the Origin or one will be generated.
     */
    addOrigin(origin: IOrigin, originId?: string): string;
    private renderErrorResponses;
    /**
     * Adds a new behavior to this distribution for the given pathPattern.
     *
     * @param pathPattern the path pattern (e.g., 'images/*') that specifies which requests to apply the behavior to.
     * @param origin the origin to use for this behavior
     * @param behaviorOptions the options for the behavior at this path.
     */
    addBehavior(pathPattern: string, origin: IOrigin, behaviorOptions?: AddBehaviorOptions): void;
    /**
     * Creates and returns the Terraform representation of this behavior.
     * This renders as a "CloudfrontDistributionDefaultCacheBehavior"
     * regardless if this is a default cache behavior or not, as the two
     * are identical except the `pathPattern` is omitted for the default
     * cache behavior.
     *
     * @internal
     */
    private _renderDefaultCacheBehavior;
    private renderRestrictions;
    private validateLocations;
    private renderViewerCertificate;
    /**
     * Conditionally lookup or create a child based on the id provided.
     * If the id is undefined, it will return undefined.
     *
     * @param id the id of the child to lookup or create
     * @param constructType the type of the child to create
     * @param config the configuration to pass to the child
     */
    private dataLookup;
}
export interface GeoRestriction {
    readonly locations: string[];
    readonly restrictionType: GeoRestrictionType;
}
export declare enum GeoRestrictionType {
    NONE = "none",
    WHITELIST = "whitelist",
    BLACKLIST = "blacklist"
}
/** Maximum HTTP version to support */
export declare enum HttpVersion {
    /** HTTP 1.1 */
    HTTP1_1 = "http1.1",
    /** HTTP 2 */
    HTTP2 = "http2",
    /** HTTP 2 and HTTP 3 */
    HTTP2_AND_3 = "http2and3",
    /** HTTP 3 */
    HTTP3 = "http3"
}
/**
 * The price class determines how many edge locations CloudFront will use for your distribution.
 * See https://aws.amazon.com/cloudfront/pricing/ for full list of supported regions.
 */
export declare enum PriceClass {
    /** USA, Canada, Europe, & Israel */
    PRICE_CLASS_100 = "PriceClass_100",
    /** PRICE_CLASS_100 + South Africa, Kenya, Middle East, Japan, Singapore, South Korea, Taiwan, Hong Kong, & Philippines */
    PRICE_CLASS_200 = "PriceClass_200",
    /** All locations */
    PRICE_CLASS_ALL = "PriceClass_All"
}
/**
 * The SSL method CloudFront will use for your distribution.
 *
 * Server Name Indication (SNI) - is an extension to the TLS computer networking protocol by which a client indicates
 *  which hostname it is attempting to connect to at the start of the handshaking process. This allows a server to present
 *  multiple certificates on the same IP address and TCP port number and hence allows multiple secure (HTTPS) websites
 * (or any other service over TLS) to be served by the same IP address without requiring all those sites to use the same certificate.
 *
 * CloudFront can use SNI to host multiple distributions on the same IP - which a large majority of clients will support.
 *
 * If your clients cannot support SNI however - CloudFront can use dedicated IPs for your distribution - but there is a prorated monthly charge for
 * using this feature. By default, we use SNI - but you can optionally enable dedicated IPs (VIP).
 *
 * See the CloudFront SSL for more details about pricing : https://aws.amazon.com/cloudfront/custom-ssl-domains/
 *
 */
export declare enum SSLMethod {
    SNI = "sni-only",
    VIP = "vip"
}
/**
 * The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections.
 * CloudFront serves your objects only to browsers or devices that support at least the SSL version that you specify.
 */
export declare enum SecurityPolicyProtocol {
    SSL_V3 = "SSLv3",
    TLS_V1 = "TLSv1",
    TLS_V1_2016 = "TLSv1_2016",
    TLS_V1_1_2016 = "TLSv1.1_2016",
    TLS_V1_2_2018 = "TLSv1.2_2018",
    TLS_V1_2_2019 = "TLSv1.2_2019",
    TLS_V1_2_2021 = "TLSv1.2_2021"
}
/**
 * Options for configuring custom error responses.
 */
export interface ErrorResponse {
    /**
     * The minimum amount of time, in seconds, that you want CloudFront to cache the HTTP status code specified in ErrorCode.
     *
     * @default - the default caching TTL behavior applies
     */
    readonly ttl?: Duration;
    /**
     * The HTTP status code for which you want to specify a custom error page and/or a caching duration.
     */
    readonly httpStatus: number;
    /**
     * The HTTP status code that you want CloudFront to return to the viewer along with the custom error page.
     *
     * If you specify a value for `responseHttpStatus`, you must also specify a value for `responsePagePath`.
     *
     * @default - the error code will be returned as the response code.
     */
    readonly responseHttpStatus?: number;
    /**
     * The path to the custom error page that you want CloudFront to return to a viewer when your origin returns the
     * `httpStatus`, for example, /4xx-errors/403-forbidden.html
     *
     * @default - the default CloudFront response is shown.
     */
    readonly responsePagePath?: string;
}
/**
 * Options for creating a new behavior.
 */
export interface BehaviorOptions extends AddBehaviorOptions {
    /**
     * The origin that you want CloudFront to route requests to when they match this behavior.
     */
    readonly origin: IOrigin;
}
/**
 * Options for adding a new behavior to a Distribution.
 */
export interface AddBehaviorOptions {
    /**
     * HTTP methods to allow for this behavior.
     *
     * @default AllowedMethods.ALLOW_GET_HEAD
     */
    readonly allowedMethods?: AllowedMethods;
    /**
     * HTTP methods to cache for this behavior.
     *
     * @default CachedMethods.CACHE_GET_HEAD
     */
    readonly cachedMethods?: CachedMethods;
    /**
     * The cache policy for this behavior. The cache policy determines what values are included in the cache key,
     * and the time-to-live (TTL) values for the cache.
     *
     * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/controlling-the-cache-key.html.
     * @default ManagedCachePolicy.CACHING_OPTIMIZED
     */
    readonly cachePolicy?: ManagedCachePolicy;
    /**
     * Whether you want CloudFront to automatically compress certain files for this cache behavior.
     * See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/ServingCompressedFiles.html#compressed-content-cloudfront-file-types
     * for file types CloudFront will compress.
     *
     * @default true
     */
    readonly compress?: boolean;
    /**
     * The origin request policy for this behavior. The origin request policy determines which values (e.g., headers, cookies)
     * are included in requests that CloudFront sends to the origin.
     *
     * @default - none
     */
    readonly originRequestPolicy?: ManagedOriginRequestPolicy;
    /**
     * The response headers policy for this behavior. The response headers policy determines which headers are included in responses
     *
     * @default - none
     */
    readonly responseHeadersPolicy?: ManagedResponseHeadersPolicy | IResponseHeadersPolicy;
    /**
     * Set this to true to indicate you want to distribute media files in the Microsoft Smooth Streaming format using this behavior.
     *
     * @default false
     */
    readonly smoothStreaming?: boolean;
    /**
     * The protocol that viewers can use to access the files controlled by this behavior.
     *
     * @default ViewerProtocolPolicy.ALLOW_ALL
     */
    readonly viewerProtocolPolicy?: ViewerProtocolPolicy;
    /**
     * The CloudFront functions to invoke before serving the contents.
     *
     * @default - no functions will be invoked
     */
    readonly functionAssociations?: FunctionAssociation[];
}
/**
 * The HTTP methods that the Behavior will accept requests on.
 */
export declare class AllowedMethods {
    /** HEAD and GET */
    static readonly ALLOW_GET_HEAD: AllowedMethods;
    /** HEAD, GET, and OPTIONS */
    static readonly ALLOW_GET_HEAD_OPTIONS: AllowedMethods;
    /** All supported HTTP methods */
    static readonly ALLOW_ALL: AllowedMethods;
    /** HTTP methods supported */
    readonly methods: string[];
    private constructor();
}
/**
 * The HTTP methods that the Behavior will cache requests on.
 */
export declare class CachedMethods {
    /** HEAD and GET */
    static readonly CACHE_GET_HEAD: CachedMethods;
    /** HEAD, GET, and OPTIONS */
    static readonly CACHE_GET_HEAD_OPTIONS: CachedMethods;
    /** HTTP methods supported */
    readonly methods: string[];
    private constructor();
}
/**
 * How HTTPs should be handled with your distribution.
 */
export declare enum ViewerProtocolPolicy {
    /** HTTPS only */
    HTTPS_ONLY = "https-only",
    /** Will redirect HTTP requests to HTTPS */
    REDIRECT_TO_HTTPS = "redirect-to-https",
    /** Both HTTP and HTTPS supported */
    ALLOW_ALL = "allow-all"
}
/**
 * CloudFront provides a set of managed cache policies that you can attach to any of your distribution's cache behaviors.
 * With a managed cache policy, you don't need to write or maintain your own cache policy. The managed policies use settings that are optimized for specific use cases.
 *
 * @link https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
 * @link https://registry.terraform.io/providers/hashicorp/aws/5.60.0/docs/data-sources/cloudfront_cache_policy#aws-managed-policies
 */
export declare enum ManagedCachePolicy {
    /**
     * This policy is designed for use with an origin that is an AWS Amplify web app.
     */
    AMPLIFY = "Managed-Amplify",
    /**
     * Optimize cache efficiency by minimizing the values that CloudFront includes in the cache key.
     * Query strings and cookies are not included in the cache key, and only the normalized 'Accept-Encoding' header is included.
     */
    CACHING_OPTIMIZED = "Managed-CachingOptimized",
    /**
     * Optimize cache efficiency by minimizing the values that CloudFront includes in the cache key.
     * Query strings and cookies are not included in the cache key, and only the normalized 'Accept-Encoding' header is included.
     * Disables cache compression.
     */
    CACHING_OPTIMIZED_FOR_UNCOMPRESSED_OBJECTS = "Managed-CachingOptimizedForUncompressedObjects",
    /** Disables caching. This policy is useful for dynamic content and for requests that are not cacheable. */
    CACHING_DISABLED = "Managed-CachingDisabled",
    /** Designed for use with an origin that is an AWS Elemental MediaPackage endpoint. */
    ELEMENTAL_MEDIA_PACKAGE = "Managed-Elemental-MediaPackage",
    /**
     * Designed for use with an origin that returns Cache-Control HTTP response headers and does not serve different content based on values present in the query string.
     */
    USE_ORIGIN_CACHE_CONTROL_HEADERS = "Managed-UseOriginCacheControlHeaders",
    /**
     * Designed for use with an origin that returns Cache-Control HTTP response headers and serves different content based on values present in the query string.
     */
    USE_ORIGIN_CACHE_CONTROL_HEADERS_QUERY_STRINGS = "Managed-UseOriginCacheControlHeaders-QueryStrings"
}
/**
 * Origin Request Policy configuration.
 *
 * @link https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
 * @link https://registry.terraform.io/providers/hashicorp/aws/5.60.0/docs/data-sources/cloudfront_origin_request_policy#aws-managed-policies
 */
export declare enum ManagedOriginRequestPolicy {
    /** This policy includes only the User-Agent and Referer headers. It doesn’t include any query strings or cookies. */
    USER_AGENT_REFERER_HEADERS = "Managed-UserAgentRefererHeaders",
    /** This policy includes the header that enables cross-origin resource sharing (CORS) requests when the origin is a custom origin. */
    CORS_CUSTOM_ORIGIN = "Managed-CORS-CustomOrigin",
    /** This policy includes the headers that enable cross-origin resource sharing (CORS) requests when the origin is an Amazon S3 bucket. */
    CORS_S3_ORIGIN = "Managed-CORS-S3Origin",
    /** This policy includes all values (query strings, headers, and cookies) in the viewer request. */
    ALL_VIEWER = "Managed-AllViewer",
    /** This policy is designed for use with an origin that is an AWS Elemental MediaTailor endpoint. */
    ELEMENTAL_MEDIA_TAILOR = "Managed-Elemental-MediaTailor-PersonalizedManifests",
    /** This policy includes all values (headers, cookies, and query strings) in the viewer request, and all CloudFront headers that were released through June 2022 (CloudFront headers released after June 2022 are not included). */
    ALL_VIEWER_AND_CLOUDFRONT_2022 = "Managed-AllViewerAndCloudFrontHeaders-2022-06",
    /** This policy includes all values (query strings, and cookies) except the header in the viewer request. */
    ALL_VIEWER_EXCEPT_HOST_HEADER = "Managed-AllViewerExceptHostHeader"
}

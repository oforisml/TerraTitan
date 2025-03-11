import { cloudfrontDistribution } from "@cdktf/provider-aws";
import { Duration } from "../../";
import { IBucket } from "../storage";
/**
 * Represents the concept of a CloudFront Origin.
 * You provide one or more origins when creating a Distribution.
 */
export interface IOrigin {
    /**
     * The method called when a given Origin is added
     * (for the first time) to a Distribution.
     */
    render(id: string): cloudfrontDistribution.CloudfrontDistributionOrigin;
}
/**
 * Options to define an Origin.
 */
export interface OriginOptions {
    /**
     * The number of seconds that CloudFront waits when trying to establish a connection to the origin.
     * Valid values are 1-10 seconds, inclusive.
     *
     * @default Duration.seconds(10)
     */
    readonly connectionTimeout?: Duration;
    /**
     * The number of times that CloudFront attempts to connect to the origin; valid values are 1, 2, or 3 attempts.
     *
     * @default 3
     */
    readonly connectionAttempts?: number;
    /**
     * A list of HTTP header names and values that CloudFront adds to requests it sends to the origin.
     *
     * @default {}
     */
    readonly customHeaders?: Record<string, string>;
}
/**
 * Properties to define an Origin.
 */
export interface OriginProps extends OriginOptions {
    /**
     * An optional path that CloudFront appends to the origin domain name when CloudFront requests content from the origin.
     * Must begin, but not end, with '/' (e.g., '/production/images').
     *
     * @default '/'
     */
    readonly originPath?: string;
}
/**
 * Defines what protocols CloudFront will use to connect to an origin.
 */
export declare enum OriginProtocolPolicy {
    /** Connect on HTTP only */
    HTTP_ONLY = "http-only",
    /** Connect with the same protocol as the viewer */
    MATCH_VIEWER = "match-viewer",
    /** Connect on HTTPS only */
    HTTPS_ONLY = "https-only"
}
export declare enum OriginSslPolicy {
    SSL_V3 = "SSLv3",
    TLS_V1 = "TLSv1",
    TLS_V1_1 = "TLSv1.1",
    TLS_V1_2 = "TLSv1.2"
}
/**
 * Represents a distribution origin, that describes the Amazon S3 bucket, HTTP server (for example, a web server),
 * Amazon MediaStore, or other server from which CloudFront gets your files.
 */
export declare abstract class OriginBase implements IOrigin {
    private readonly domainName;
    private readonly originPath?;
    private readonly connectionTimeout?;
    private readonly connectionAttempts?;
    private readonly customHeaders?;
    protected constructor(domainName: string, props?: OriginProps);
    /**
     * Called internally by the Distribution to render the origin.
     */
    render(originId: string): cloudfrontDistribution.CloudfrontDistributionOrigin;
    protected renderS3OriginConfig(): cloudfrontDistribution.CloudfrontDistributionOriginS3OriginConfig | undefined;
    protected renderCustomOriginConfig(): cloudfrontDistribution.CloudfrontDistributionOriginCustomOriginConfig | undefined;
    private renderCustomHeaders;
    /**
     * If the path is defined, it must start with a '/' and not end with a '/'.
     * This method takes in the originPath, and returns it back (if undefined) or adds/removes the '/' as appropriate.
     */
    private validateOriginPath;
}
/**
 * An Origin that is backed by an S3 bucket.
 *
 * If the bucket is configured for website hosting, this origin will be configured to use the bucket as an
 * HTTP server origin and will use the bucket's configured website redirects and error handling. Otherwise,
 * the origin is created as a bucket origin and will use CloudFront's redirect and error handling.
 */
export declare class S3Origin implements IOrigin {
    private readonly origin;
    constructor(bucket: IBucket, props?: OriginProps);
    render(originId: string): cloudfrontDistribution.CloudfrontDistributionOrigin;
}
/**
 * Properties for an Origin backed by an S3 website-configured bucket, load balancer, or custom HTTP server.
 */
export interface HttpOriginProps extends OriginProps {
    /**
     * Specifies the protocol (HTTP or HTTPS) that CloudFront uses to connect to the origin.
     *
     * @default OriginProtocolPolicy.HTTPS_ONLY
     */
    readonly protocolPolicy?: OriginProtocolPolicy;
    /**
     * The SSL versions to use when interacting with the origin.
     *
     * @default OriginSslPolicy.TLS_V1_2
     */
    readonly originSslProtocols?: OriginSslPolicy[];
    /**
     * The HTTP port that CloudFront uses to connect to the origin.
     *
     * @default 80
     */
    readonly httpPort?: number;
    /**
     * The HTTPS port that CloudFront uses to connect to the origin.
     *
     * @default 443
     */
    readonly httpsPort?: number;
    /**
     * Specifies how long, in seconds, CloudFront waits for a response from the origin, also known as the origin response timeout.
     * The valid range is from 1 to 180 seconds, inclusive.
     *
     * Note that values over 60 seconds are possible only after a limit increase request for the origin response timeout quota
     * has been approved in the target account; otherwise, values over 60 seconds will produce an error at deploy time.
     *
     * @default Duration.seconds(30)
     */
    readonly readTimeout?: Duration;
    /**
     * Specifies how long, in seconds, CloudFront persists its connection to the origin.
     * The valid range is from 1 to 180 seconds, inclusive.
     *
     * Note that values over 60 seconds are possible only after a limit increase request for the origin response timeout quota
     * has been approved in the target account; otherwise, values over 60 seconds will produce an error at deploy time.
     *
     * @default Duration.seconds(5)
     */
    readonly keepaliveTimeout?: Duration;
}
/**
 * An Origin for an HTTP server or S3 bucket configured for website hosting.
 */
export declare class HttpOrigin extends OriginBase {
    private readonly props;
    constructor(domainName: string, props?: HttpOriginProps);
    protected renderCustomOriginConfig(): cloudfrontDistribution.CloudfrontDistributionOriginCustomOriginConfig | undefined;
}

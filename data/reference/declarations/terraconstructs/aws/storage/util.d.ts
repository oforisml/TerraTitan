import { IConstruct } from "constructs";
import { BucketAttributes } from "./bucket";
export declare function parseBucketArn(construct: IConstruct, props: BucketAttributes): string;
export declare function parseBucketName(construct: IConstruct, props: BucketAttributes): string | undefined;
/**
 * All http request methods
 */
export declare enum HttpMethods {
    /**
     * The GET method requests a representation of the specified resource.
     */
    GET = "GET",
    /**
     * The PUT method replaces all current representations of the target resource with the request payload.
     */
    PUT = "PUT",
    /**
     * The HEAD method asks for a response identical to that of a GET request, but without the response body.
     */
    HEAD = "HEAD",
    /**
     * The POST method is used to submit an entity to the specified resource, often causing a change in state or side effects on the server.
     */
    POST = "POST",
    /**
     * The DELETE method deletes the specified resource.
     */
    DELETE = "DELETE"
}
/**
 * All http request methods
 */
export declare enum RedirectProtocol {
    HTTP = "http",
    HTTPS = "https"
}
/**
 * Normalize windows paths to be posix-like.
 */
export declare function normalPath(path: string): string;
export declare function s3StaticWebsiteEndpoint(region: string): string;
export declare function partitionLookup(region: string): {
    partition: Partition;
    domainSuffix: string;
};
declare enum Partition {
    Default = "aws",
    Cn = "aws-cn",
    UsGov = "aws-us-gov",
    UsIso = "aws-iso",
    UsIsoB = "aws-iso-b",
    UsIsoF = "aws-iso-f",
    EuIsoE = "aws-iso-e"
}
interface Region {
    partition: Partition;
    domainSuffix: string;
}
export declare const PARTITION_MAP: {
    [region: string]: Region;
};
export {};

import { ApplicationProtocol, LbProtocol } from "./enums";
export type Attributes = {
    [key: string]: string | undefined;
};
export declare const NO_LOADBALANCER_ARNS = "NO_LOADBALANCER_ARNS";
/**
 * Render an attribute dict to a list of { key, value } pairs
 */
export declare function renderAttributes(attributes: Attributes): any[];
export declare function lookupStringAttribute(attributes: Attributes, key: string): string | undefined;
export declare function lookupBoolAttribute(attributes: Attributes, key: string): boolean | undefined;
export declare function lookupNumberAttribute(attributes: Attributes, key: string): number | undefined;
/**
 * Return the appropriate default port for a given protocol
 */
export declare function defaultPortForProtocol(proto: ApplicationProtocol): number;
/**
 * Return the appropriate default protocol for a given port
 */
export declare function defaultProtocolForPort(port: number): ApplicationProtocol;
/**
 * Given a protocol and a port, try to guess the other one if it's undefined
 */
export declare function determineProtocolAndPort(protocol: ApplicationProtocol | undefined, port: number | undefined): [ApplicationProtocol | undefined, number | undefined];
/**
 * Helper function to default undefined input props
 */
export declare function ifUndefined<T>(x: T | undefined, def: T): T;
/**
 * Helper function for ensuring network listeners and target groups only accept valid
 * protocols.
 */
export declare function validateNetworkProtocol(protocol: LbProtocol): void;
export declare function parseLoadBalancerFullName(arn: string): string;
/**
 * Transforms:
 *
 *   arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/my-target-group/da693d633af407a0
 *
 * Into:
 *
 *   targetgroup/my-target-group/da693d633af407a0
 */
export declare function parseTargetGroupFullName(arn: string): string;
export declare class TargetGroupAttribute {
    static deregistrationDelayTimeoutSeconds: string;
    static stickinessEnabled: string;
    static stickinessType: string;
    static loadBalancingCrossZoneEnabled: string;
    static targetGroupHealthDNSFailoverMinimumHealthyTargetsCount: string;
    static targetGroupHealthDNSFailoverMinimumHealthyTargetsPercentage: string;
    static targetGroupHealthUnhealthyStateRoutingMinimumHealthyTargetsCount: string;
    static targetGroupHealthUnhealthyStateRoutingMinimumHealthyTargetsPercentage: string;
    static loadBalancingAlgorithmType: string;
    static loadBalancingAlgorithmAnomalyMitigation: string;
    static slowStartDurationSeconds: string;
    static stickinessAppCookieCookieName: string;
    static stickinessAppCookieDurationSeconds: string;
    static stickinessLBCookieDurationSeconds: string;
    static lambdaMultiValueHeadersEnabled: string;
    static deregistrationDelayConnectionTerminationEnabled: string;
    static preserveClientIPEnabled: string;
    static proxyProtocolV2Enabled: string;
    static targetHealthStateUnhealthyConnectionTerminationEnabled: string;
    static targetHealthStateUnhealthyDrainingIntervalSeconds: string;
    static targetFailoverOnDeregistration: string;
    static targetFailoverOnUnhealthy: string;
}
export declare class LoadBalancerAttribute {
    static deletionProtectionEnabled: string;
    static loadBalancingCrossZoneEnabled: string;
    static accessLogsS3Enabled: string;
    static accessLogsS3Bucket: string;
    static accessLogsS3Prefix: string;
    static iPv6DenyAllIGWTraffic: string;
    static idleTimeoutTimeoutSeconds: string;
    static clientKeepAliveSeconds: string;
    static connectionLogsS3Enabled: string;
    static connectionLogsS3Bucket: string;
    static connectionLogsS3Prefix: string;
    static routingHTTPDesyncMitigationMode: string;
    static routingHTTPDropInvalidHeaderFieldsEnabled: string;
    static routingHTTPPreserveHostHeaderEnabled: string;
    static routingHTTPXAmznTLSVersionAndCipherSuiteEnabled: string;
    static routingHTTPXFFClientPortEnabled: string;
    static routingHTTPXFFHeaderProcessingMode: string;
    static routingHTTP2Enabled: string;
    static wAFFailOpenEnabled: string;
    static zonalShiftConfigEnabled: string;
    static dNSRecordClientRoutingPolicy: string;
}
export declare class ListenerAttribute {
    static tcpIdleTimeoutSeconds: string;
    static routingHTTPRequestXAmznMtlsClientcertHeaderName: string;
    static routingHTTPRequestXAmznMtlsClientcertIssuerHeaderName: string;
    static routingHTTPRequestXAmznMtlsClientcertLeafHeaderName: string;
    static routingHTTPRequestXAmznMtlsClientcertSerialNumberHeaderName: string;
    static routingHTTPRequestXAmznMtlsClientcertSubjectHeaderName: string;
    static routingHTTPRequestXAmznMtlsClientcertValidityHeaderName: string;
    static routingHTTPRequestXAmznTlsCipherSuiteHeaderName: string;
    static routingHTTPRequestXAmznTlsVersionHeaderName: string;
    static routingHTTPResponseAccessControlAllowCredentialsHeaderValue: string;
    static routingHTTPResponseAccessControlAllowHeadersHeaderValue: string;
    static routingHTTPResponseAccessControlAllowMethodsHeaderValue: string;
    static routingHTTPResponseAccessControlAllowOriginHeaderValue: string;
    static routingHTTPResponseAccessControlExposeHeadersHeaderValue: string;
    static routingHTTPResponseAccessControlMaxAgeHeaderValue: string;
    static routingHTTPResponseContentSecurityPolicyHeaderValue: string;
    static routingHTTPResponseServerEnabled: string;
    static routingHTTPResponseStrictTransportSecurityHeaderValue: string;
    static routingHTTPResponseXContentTypeOptionsHeaderValue: string;
    static routingHTTPResponseXFrameOptionsHeaderValue: string;
}

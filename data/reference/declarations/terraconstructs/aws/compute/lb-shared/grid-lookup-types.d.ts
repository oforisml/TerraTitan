/**
 * Type of load balancer
 */
export declare enum LoadBalancerType {
    /**
     * Network load balancer
     */
    NETWORK = "network",
    /**
     * Application load balancer
     */
    APPLICATION = "application"
}
/**
 * The protocol for connections from clients to the load balancer
 */
export declare enum LoadBalancerListenerProtocol {
    /**
     * HTTP protocol
     */
    HTTP = "HTTP",
    /**
     * HTTPS protocol
     */
    HTTPS = "HTTPS",
    /**
     * TCP protocol
     */
    TCP = "TCP",
    /**
     * TLS protocol
     */
    TLS = "TLS",
    /**
     * UDP protocol
     * */
    UDP = "UDP",
    /**
     * TCP and UDP protocol
     * */
    TCP_UDP = "TCP_UDP"
}

import * as compute from "../";
export declare class LambdaTarget implements compute.IApplicationLoadBalancerTarget {
    private readonly fn;
    /**
     * Create a new Lambda target
     *
     * @param functionArn The Lambda Function to load balance to
     */
    constructor(fn: compute.IFunction);
    /**
     * Register this instance target with a load balancer
     *
     * Don't call this, it is called automatically when you add the target to a
     * load balancer.
     */
    attachToApplicationTargetGroup(targetGroup: compute.IApplicationTargetGroup): compute.LoadBalancerTargetProps;
    /**
     * Register this instance target with a load balancer
     *
     * Don't call this, it is called automatically when you add the target to a
     * load balancer.
     */
    attachToNetworkTargetGroup(targetGroup: compute.INetworkTargetGroup): compute.LoadBalancerTargetProps;
    private attach;
}

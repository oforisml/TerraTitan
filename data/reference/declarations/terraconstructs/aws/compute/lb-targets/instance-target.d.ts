import * as compute from "../";
/**
 * An EC2 instance that is the target for load balancing
 *
 * If you register a target of this type, you are responsible for making
 * sure the load balancer's security group can connect to the instance.
 */
export declare class InstanceIdTarget implements compute.IApplicationLoadBalancerTarget, compute.INetworkLoadBalancerTarget {
    private readonly instanceId;
    private readonly port?;
    /**
     * Create a new Instance target
     *
     * @param instanceId Instance ID of the instance to register to
     * @param port Override the default port for the target group
     */
    constructor(instanceId: string, port?: number | undefined);
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
export declare class InstanceTarget extends InstanceIdTarget {
    /**
     * Create a new Instance target
     *
     * @param instance Instance to register to
     * @param port Override the default port for the target group
     */
    constructor(instance: compute.Instance, port?: number);
}

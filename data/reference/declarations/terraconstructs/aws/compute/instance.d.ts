import { instance } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { Duration } from "../../duration";
import { IAwsConstruct, AwsConstructBase } from "../aws-construct";
import { Connections, IConnectable } from "./connections";
import { InstanceType } from "./instance-types";
import { IKeyPair } from "./key-pair";
import { CpuCredits, InstanceInitiatedShutdownBehavior } from "./launch-template";
import { IMachineImage, OperatingSystemType } from "./machine-image";
import { IPlacementGroup } from "./placement-group";
import { ISecurityGroup } from "./security-group";
import { UserData } from "./user-data";
import { BlockDevice } from "./volume";
import { IVpc, SubnetSelection } from "./vpc";
import * as iam from "../iam";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface InstanceOutputs {
    /**
     * The instance's ID
     *
     * @attribute
     */
    readonly instanceId: string;
}
export interface IInstance extends IAwsConstruct, IConnectable, iam.IGrantable {
    /** Strongly typed outputs */
    readonly instanceOutputs: InstanceOutputs;
    /**
     * The instance's ID
     *
     * @attribute
     */
    readonly instanceId: string;
    /**
     * The availability zone the instance was launched in
     *
     * @attribute
     */
    readonly instanceAvailabilityZone: string;
    /**
     * Private DNS name for this instance
     * @attribute
     */
    readonly instancePrivateDnsName: string;
    /**
     * Private IP for this instance
     *
     * @attribute
     */
    readonly instancePrivateIp: string;
    /**
     * Publicly-routable DNS name for this instance.
     *
     * (May be an empty string if the instance does not have a public name).
     *
     * @attribute
     */
    readonly instancePublicDnsName: string;
    /**
     * Publicly-routable IP  address for this instance.
     *
     * (May be an empty string if the instance does not have a public IP).
     *
     * @attribute
     */
    readonly instancePublicIp: string;
}
/**
 * Properties of an EC2 Instance
 */
export interface InstanceProps {
    /**
     * Name of SSH keypair to grant access to instance
     *
     * @default - No SSH access will be possible.
     * @deprecated - Use `keyPair` instead - https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html#using-an-existing-ec2-key-pair
     */
    readonly keyName?: string;
    /**
     * The SSH keypair to grant access to the instance.
     *
     * @default - No SSH access will be possible.
     */
    readonly keyPair?: IKeyPair;
    /**
     * Where to place the instance within the VPC
     *
     * @default - Private subnets.
     */
    readonly vpcSubnets?: SubnetSelection;
    /**
     * In which AZ to place the instance within the VPC
     *
     * @default - Random zone.
     */
    readonly availabilityZone?: string;
    /**
     * Whether the instance could initiate connections to anywhere by default.
     * This property is only used when you do not provide a security group.
     *
     * @default true
     */
    readonly allowAllOutbound?: boolean;
    /**
     * Whether the instance could initiate IPv6 connections to anywhere by default.
     * This property is only used when you do not provide a security group.
     *
     * @default false
     */
    readonly allowAllIpv6Outbound?: boolean;
    /**
     * The length of time to wait for the resourceSignalCount
     *
     * The maximum value is 43200 (12 hours).
     *
     * @default Duration.minutes(5)
     */
    readonly resourceSignalTimeout?: Duration;
    /**
     * VPC to launch the instance in.
     */
    readonly vpc: IVpc;
    /**
     * Security Group to assign to this instance
     *
     * @default - create new security group
     */
    readonly securityGroup?: ISecurityGroup;
    /**
     * Type of instance to launch
     */
    readonly instanceType: InstanceType;
    /**
     * AMI to launch
     */
    readonly machineImage: IMachineImage;
    /**
     * Specific UserData to use
     *
     * The UserData may still be mutated after creation.
     *
     * Updates to this field will trigger a stop/start of the EC2 instance by default.
     *
     * If userDataCausesReplacement is set then updates to this field will trigger
     * a destroy and recreate of the EC2 instance.
     *
     * @default - A UserData object appropriate for the MachineImage's
     * Operating System is created.
     */
    readonly userData?: UserData;
    /**
     * Changes to the UserData force replacement
     *
     * Depending the EC2 instance type, changing UserData either
     * restarts the instance or replaces the instance.
     *
     * - Instance store-backed instances are replaced.
     * - EBS-backed instances are restarted.
     *
     * By default, restarting does not execute the new UserData so you
     * will need a different mechanism to ensure the instance is restarted.
     *
     * default - true
     */
    readonly userDataCausesReplacement?: boolean;
    /**
     * An IAM role to associate with the instance profile assigned to this Auto Scaling Group.
     *
     * The role must be assumable by the service principal `ec2.amazonaws.com`:
     * Note: You can provide an instanceProfile or a role, but not both.
     *
     * @example
     * const role = new iam.Role(this, 'MyRole', {
     *   assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')
     * });
     *
     * @default - A role will automatically be created, it can be accessed via the `role` property
     */
    readonly role?: iam.IRole;
    /**
     * The instance profile used to pass role information to EC2 instances.
     *
     * Note: You can provide an instanceProfile or a role, but not both.
     *
     * @default - No instance profile
     */
    readonly instanceProfile?: iam.IInstanceProfile;
    /**
     * The name of the instance
     *
     * @default - CDK generated name
     */
    readonly instanceName?: string;
    /**
     * Specifies whether to enable an instance launched in a VPC to perform NAT.
     * This controls whether source/destination checking is enabled on the instance.
     * A value of true means that checking is enabled, and false means that checking is disabled.
     * The value must be false for the instance to perform NAT.
     *
     * @default true
     */
    readonly sourceDestCheck?: boolean;
    /**
     * Specifies how block devices are exposed to the instance. You can specify virtual devices and EBS volumes.
     *
     * Each instance that is launched has an associated root device volume,
     * either an Amazon EBS volume or an instance store volume.
     * You can use block device mappings to specify additional EBS volumes or
     * instance store volumes to attach to an instance when it is launched.
     *
     * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/block-device-mapping-concepts.html
     * @see https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/instance#ebs-ephemeral-and-root-block-devices
     *
     * @default - Uses the block device mapping of the AMI
     */
    readonly blockDevices?: BlockDevice[];
    /**
     * Defines a private IP address to associate with an instance.
     *
     * Private IP should be available within the VPC that the instance is build within.
     *
     * @default - no association
     */
    readonly privateIpAddress?: string;
    /**
     * Propagate the EC2 instance tags to the EBS volumes.
     *
     * Do not propagate tags if you plan to manage block device tags outside
     * the `aws_instance` configuration, such as using `tags` in an `aws_ebs_volume`
     * resource attached via `aws_volume_attachment`.
     *
     * Doing so will result in resource cycling and inconsistent behavior.
     *
     * @default - false
     */
    readonly propagateTagsToVolumeOnCreation?: boolean;
    /**
     * Whether IMDSv2 should be required on this instance.
     *
     * @default - false
     */
    readonly requireImdsv2?: boolean;
    /**
     * Whether "Detailed Monitoring" is enabled for this instance
     * Keep in mind that Detailed Monitoring results in extra charges
     *
     * @see http://aws.amazon.com/cloudwatch/pricing/
     * @default - false
     */
    readonly detailedMonitoring?: boolean;
    /**
     * Add SSM session permissions to the instance role
     *
     * Setting this to `true` adds the necessary permissions to connect
     * to the instance using SSM Session Manager. You can do this
     * from the AWS Console.
     *
     * NOTE: Setting this flag to `true` may not be enough by itself.
     * You must also use an AMI that comes with the SSM Agent, or install
     * the SSM Agent yourself. See
     * [Working with SSM Agent](https://docs.aws.amazon.com/systems-manager/latest/userguide/ssm-agent.html)
     * in the SSM Developer Guide.
     *
     * @default false
     */
    readonly ssmSessionPermissions?: boolean;
    /**
     * Whether to associate a public IP address to the primary network interface attached to this instance.
     *
     * You cannot specify this property and `ipv6AddressCount` at the same time.
     *
     * @default - public IP address is automatically assigned based on default behavior
     */
    readonly associatePublicIpAddress?: boolean;
    /**
     * Specifying the CPU credit type for burstable EC2 instance types (T2, T3, T3a, etc).
     * The unlimited CPU credit option is not supported for T3 instances with a dedicated host.
     *
     * @default - T2 instances are standard, while T3, T4g, and T3a instances are unlimited.
     */
    readonly creditSpecification?: CpuCredits;
    /**
     * Indicates whether the instance is optimized for Amazon EBS I/O.
     *
     * This optimization provides dedicated throughput to Amazon EBS and an optimized configuration stack to provide optimal Amazon EBS I/O performance.
     * This optimization isn't available with all instance types.
     * Additional usage charges apply when using an EBS-optimized instance.
     *
     * @default false
     */
    readonly ebsOptimized?: boolean;
    /**
     * If true, the instance will not be able to be terminated using the Amazon EC2 console, CLI, or API.
     *
     * To change this attribute after launch, use [ModifyInstanceAttribute](https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_ModifyInstanceAttribute.html).
     * Alternatively, if you set InstanceInitiatedShutdownBehavior to terminate, you can terminate the instance
     * by running the shutdown command from the instance.
     *
     * @see http://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-instance.html#cfn-ec2-instance-disableapitermination
     *
     * @default false
     */
    readonly disableApiTermination?: boolean;
    /**
     * Indicates whether an instance stops or terminates when you initiate shutdown from the instance
     * (using the operating system command for system shutdown).
     *
     * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/terminating-instances.html#Using_ChangingInstanceInitiatedShutdownBehavior
     *
     * @default InstanceInitiatedShutdownBehavior.STOP
     */
    readonly instanceInitiatedShutdownBehavior?: InstanceInitiatedShutdownBehavior;
    /**
     * The placement group that you want to launch the instance into.
     *
     * @default - no placement group will be used for this instance.
     */
    readonly placementGroup?: IPlacementGroup;
    /**
     * Whether the instance is enabled for AWS Nitro Enclaves.
     *
     * Nitro Enclaves requires a Nitro-based virtualized parent instance with specific Intel/AMD with at least 4 vCPUs
     * or Graviton with at least 2 vCPUs instance types and Linux/Windows host OS,
     * while the enclave itself supports only Linux OS.
     *
     * You can't set both `enclaveEnabled` and `hibernationEnabled` to true on the same instance.
     *
     * @see https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html#nitro-enclave-reqs
     *
     * @default - false
     */
    readonly enclaveEnabled?: boolean;
    /**
     * Whether the instance is enabled for hibernation.
     *
     * You can't set both `enclaveEnabled` and `hibernationEnabled` to true on the same instance.
     *
     * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-ec2-instance-hibernationoptions.html
     *
     * @default - false
     */
    readonly hibernationEnabled?: boolean;
    /**
     * The number of IPv6 addresses to associate with the primary network interface.
     *
     * Amazon EC2 chooses the IPv6 addresses from the range of your subnet.
     *
     * You cannot specify this property and `associatePublicIpAddress` at the same time.
     *
     * @default - For instances associated with an IPv6 subnet, use 1; otherwise, use 0.
     */
    readonly ipv6AddressCount?: number;
}
/**
 * This represents a single EC2 instance
 */
export declare class Instance extends AwsConstructBase implements IInstance {
    get instanceOutputs(): InstanceOutputs;
    get outputs(): Record<string, any>;
    /**
     * The type of OS the instance is running.
     */
    readonly osType: OperatingSystemType;
    /**
     * Allows specify security group connections for the instance.
     */
    readonly connections: Connections;
    /**
     * The IAM role assumed by the instance.
     */
    readonly role: iam.IRole;
    /**
     * The principal to grant permissions to
     */
    readonly grantPrincipal: iam.IPrincipal;
    /**
     * UserData for the instance
     */
    readonly userData: UserData;
    /**
     * the underlying instance resource
     */
    readonly instance: instance.Instance;
    /**
     * the primary network inteface (if applicable)
     */
    private readonly primaryNetworkInterface?;
    /**
     * the primary network interface id.
     */
    readonly primaryNetworkInterfaceId: string;
    /**
     * @attribute
     */
    readonly instanceId: string;
    /**
     * @attribute
     */
    readonly instanceAvailabilityZone: string;
    /**
     * @attribute
     */
    readonly instancePrivateDnsName: string;
    /**
     * @attribute
     */
    readonly instancePrivateIp: string;
    /**
     * @attribute
     */
    readonly instancePublicDnsName: string;
    /**
     * @attribute
     */
    readonly instancePublicIp: string;
    private readonly securityGroup;
    private readonly securityGroups;
    constructor(scope: Construct, id: string, props: InstanceProps);
    /**
     * Add the security group to the instance.
     *
     * @param securityGroup: The security group to add
     */
    addSecurityGroup(securityGroup: ISecurityGroup): void;
    /**
     * Add command to the startup script of the instance.
     * The command must be in the scripting language supported by the instance's OS (i.e. Linux/Windows).
     */
    addUserData(...commands: string[]): void;
    /**
     * Adds a statement to the IAM role assumed by the instance.
     */
    addToRolePolicy(statement: iam.PolicyStatement): void;
}

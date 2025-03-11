import { Construct } from "constructs";
import { IVpc, SubnetSelection } from "./vpc";
import { Duration } from "../../duration";
import { IAwsConstruct, AwsConstructBase } from "../aws-construct";
import * as cloudwatch from "../cloudwatch";
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface VpnConnectionOutputs {
    /**
     * The id of the VPN connection.
     * @attribute VpnConnectionId
     */
    readonly vpnId: string;
    /**
     * The id of the customer gateway.
     */
    readonly customerGatewayId: string;
    /**
     * The ip address of the customer gateway.
     */
    readonly customerGatewayIp: string;
    /**
     * The ASN of the customer gateway.
     */
    readonly customerGatewayAsn: number;
}
export interface IVpnConnection extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly vpnConnectionOutputs: VpnConnectionOutputs;
    /**
     * The id of the VPN connection.
     * @attribute VpnConnectionId
     */
    readonly vpnId: string;
    /**
     * The id of the customer gateway.
     */
    readonly customerGatewayId: string;
    /**
     * The ip address of the customer gateway.
     */
    readonly customerGatewayIp: string;
    /**
     * The ASN of the customer gateway.
     */
    readonly customerGatewayAsn: number;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface VpnGatewayOutputs {
    /**
     * The virtual private gateway Id
     * @attribute VpnGatewayId
     */
    readonly gatewayId: string;
}
/**
 * The virtual private gateway interface
 */
export interface IVpnGateway extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly vpnGatewayOutputs: VpnGatewayOutputs;
    /**
     * The virtual private gateway Id
     */
    readonly gatewayId: string;
}
export interface VpnTunnelOption {
    /**
     * The pre-shared key (PSK) to establish initial authentication between the
     * virtual private gateway and customer gateway. Allowed characters are
     * alphanumeric characters period `.` and underscores `_`. Must be between 8
     * and 64 characters in length and cannot start with zero (0).
     *
     * @default an Amazon generated pre-shared key
     */
    readonly preSharedKey?: string;
    /**
     * The range of inside IP addresses for the tunnel. Any specified CIDR blocks must be
     * unique across all VPN connections that use the same virtual private gateway.
     * A size /30 CIDR block from the 169.254.0.0/16 range.
     *
     * @default an Amazon generated inside IP CIDR
     */
    readonly tunnelInsideCidr?: string;
    /**
     * The IKE versions for the tunnel
     */
    readonly ikeVersions?: IkeVersion[];
    /**
     * The DPD timeout action for the tunnel
     */
    readonly dpdTimeoutAction?: DpdTimeoutAction;
    /**
     * The DPD timeout
     */
    readonly dpdTimeout?: Duration;
    /**
     * Enable tunnel lifecycle control
     */
    readonly enableTunnelLifecycleControl?: boolean;
    /**
     * The phase 1 DH group numbers
     */
    readonly phase1DhGroupNumbers?: Phase1DhGroupNumber[];
    /**
     * The phase 1 encryption algorithms
     */
    readonly phase1EncryptionAlgorithms?: EncryptionAlgorithm[];
    /**
     * The phase 1 integrity algorithms
     */
    readonly phase1IntegrityAlgorithms?: IntegrityAlgorithm[];
    /**
     * The phase 1 lifetime
     */
    readonly phase1Lifetime?: Duration;
    /**
     * The phase 2 DH group numbers
     */
    readonly phase2DhGroupNumbers?: Phase2DhGroupNumber[];
    /**
     * The phase 2 encryption algorithms
     */
    readonly phase2EncryptionAlgorithms?: EncryptionAlgorithm[];
    /**
     * The phase 2 integrity algorithms
     */
    readonly phase2IntegrityAlgorithms?: IntegrityAlgorithm[];
    /**
     * The phase 2 lifetime in seconds
     */
    readonly phase2Lifetime?: Duration;
    /**
     * The percentage of the rekey window during which the rekey time is randomly selected
     * @default 100
     * @minimum 0
     * @maximum 100
     */
    readonly rekeyFuzzPercentage?: number;
    /**
     * The margin time before phase 2 lifetime expires for IKE rekey
     * @default 540
     * @minimum 60
     * @remarks Must be between 60 and half of phase2LifetimeSeconds
     */
    readonly rekeyMarginTime?: Duration;
    /**
     * The number of packets in an IKE replay window
     * @default 1024
     * @minimum 64
     * @maximum 2048
     */
    readonly replayWindowSize?: number;
    /**
     * The action to take when the establishing the tunnel for the second VPN connection.
     *
     * By default, your customer gateway device must initiate the IKE negotiation and bring up the tunnel.
     * Specify `start` for AWS to initiate the IKE negotiation.
     */
    readonly startupAction?: TunnelStartupAction;
}
export interface VpnConnectionOptions {
    /**
     * The ip address of the customer gateway.
     */
    readonly ip: string;
    /**
     * The ASN of the customer gateway.
     *
     * @default 65000
     */
    readonly asn?: number;
    /**
     * The static routes to be routed from the VPN gateway to the customer gateway.
     *
     * @default Dynamic routing (BGP)
     */
    readonly staticRoutes?: string[];
    /**
     * The tunnel options for the VPN connection. At most two elements (one per tunnel).
     * Duplicates not allowed.
     *
     * @default Amazon generated tunnel options
     */
    readonly tunnelOptions?: VpnTunnelOption[];
}
/**
 * The VpnGateway Properties
 */
export interface VpnGatewayProps {
    /**
     * Default type ipsec.1
     *
     * This is ignored by Terraform Provider AWS
     *
     * @see https://registry.terraform.io/providers/hashicorp/aws/5.68.0/docs/resources/internet_gateway_attachment#argument-reference
     * @see https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ec2-vpngateway.html#cfn-ec2-vpngateway-type
     */
    readonly type: string;
    /**
     * Explicitly specify an Asn or let aws pick an Asn for you.
     * @default 65000
     */
    readonly amazonSideAsn?: number;
}
/**
 * Options for the Vpc.enableVpnGateway() method
 */
export interface EnableVpnGatewayOptions extends VpnGatewayProps {
    /**
     * Provide an array of subnets where the route propagation should be added.
     * @default noPropagation
     */
    readonly vpnRoutePropagation?: SubnetSelection[];
}
export interface VpnConnectionProps extends VpnConnectionOptions {
    /**
     * The VPC to connect to.
     */
    readonly vpc: IVpc;
}
/**
 * The VPN connection type.
 */
export declare enum VpnConnectionType {
    /**
     * The IPsec 1 VPN connection type.
     */
    IPSEC_1 = "ipsec.1",
    /**
     * Dummy member
     * TODO: remove once https://github.com/aws/jsii/issues/231 is fixed
     */
    DUMMY = "dummy"
}
/**
 * The VPN Gateway that shall be added to the VPC
 *
 * @resource aws_vpn_gateway
 */
export declare class VpnGateway extends AwsConstructBase implements IVpnGateway {
    /**
     * The virtual private gateway Id
     */
    readonly gatewayId: string;
    get vpnGatewayOutputs(): VpnGatewayOutputs;
    get outputs(): Record<string, any>;
    constructor(scope: Construct, id: string, props: VpnGatewayProps);
}
/**
 * Attributes of an imported VpnConnection.
 */
export interface VpnConnectionAttributes {
    /**
     * The id of the VPN connection.
     */
    readonly vpnId: string;
    /**
     * The id of the customer gateway.
     */
    readonly customerGatewayId: string;
    /**
     * The ip address of the customer gateway.
     */
    readonly customerGatewayIp: string;
    /**
     * The ASN of the customer gateway.
     */
    readonly customerGatewayAsn: number;
}
/**
 * Base class for Vpn connections.
 */
export declare abstract class VpnConnectionBase extends AwsConstructBase implements IVpnConnection {
    abstract readonly vpnId: string;
    abstract readonly customerGatewayId: string;
    abstract readonly customerGatewayIp: string;
    abstract readonly customerGatewayAsn: number;
    get vpnConnectionOutputs(): VpnConnectionOutputs;
    get outputs(): Record<string, any>;
}
/**
 * Define a VPN Connection
 *
 * @resource AWS::EC2::VPNConnection
 */
export declare class VpnConnection extends VpnConnectionBase {
    /**
     * Import a VPN connection by supplying all attributes directly
     */
    static fromVpnConnectionAttributes(scope: Construct, id: string, attrs: VpnConnectionAttributes): IVpnConnection;
    /**
     * Return the given named metric for all VPN connections in the account/region.
     */
    static metricAll(metricName: string, props?: cloudwatch.MetricOptions): cloudwatch.Metric;
    /**
     * Metric for the tunnel state of all VPN connections in the account/region.
     *
     * @default average over 5 minutes
     */
    static metricAllTunnelState(props?: cloudwatch.MetricOptions): cloudwatch.Metric;
    /**
     * Metric for the tunnel data in of all VPN connections in the account/region.
     *
     * @default sum over 5 minutes
     */
    static metricAllTunnelDataIn(props?: cloudwatch.MetricOptions): cloudwatch.Metric;
    /**
     * Metric for the tunnel data out of all VPN connections.
     *
     * @default sum over 5 minutes
     */
    static metricAllTunnelDataOut(props?: cloudwatch.MetricOptions): cloudwatch.Metric;
    readonly vpnId: string;
    readonly customerGatewayId: string;
    readonly customerGatewayIp: string;
    readonly customerGatewayAsn: number;
    constructor(scope: Construct, id: string, props: VpnConnectionProps);
}
export declare const RESERVED_TUNNEL_INSIDE_CIDR: string[];
/**
 * Action to take after DPD timeout occurs
 */
export declare enum DpdTimeoutAction {
    /**
     * End the IKE session
     */
    CLEAR = "clear",
    /**
     * Take no action
     */
    NONE = "none",
    /**
     * Restart the IKE initiation
     */
    RESTART = "restart"
}
/**
 * IKE versions permitted for VPN tunnels
 */
export declare enum IkeVersion {
    /**
     * IKE version 1
     */
    IKEV1 = "ikev1",
    /**
     * IKE version 2
     */
    IKEV2 = "ikev2"
}
/**
 * Phase 1 and 2 encryption algorithms
 */
export declare enum EncryptionAlgorithm {
    /**
     * AES with 128-bit key
     */
    AES128 = "AES128",
    /**
     * AES with 256-bit key
     */
    AES256 = "AES256",
    /**
     * AES-GCM with 128-bit key and 16 byte integrity check
     */
    AES128_GCM_16 = "AES128-GCM-16",
    /**
     * AES-GCM with 256-bit key and 16 byte integrity check
     */
    AES256_GCM_16 = "AES256-GCM-16"
}
/**
 * Phase 1 and 2 integrity algorithms
 */
export declare enum IntegrityAlgorithm {
    /**
     * SHA-1 hash algorithm
     */
    SHA1 = "SHA1",
    /**
     * SHA-2 with 256-bit digest
     */
    SHA2_256 = "SHA2-256",
    /**
     * SHA-2 with 384-bit digest
     */
    SHA2_384 = "SHA2-384",
    /**
     * SHA-2 with 512-bit digest
     */
    SHA2_512 = "SHA2-512"
}
/**
 * Phase 1 Diffie-Hellman group numbers
 */
export declare enum Phase1DhGroupNumber {
    GROUP_2 = 2,
    GROUP_14 = 14,
    GROUP_15 = 15,
    GROUP_16 = 16,
    GROUP_17 = 17,
    GROUP_18 = 18,
    GROUP_19 = 19,
    GROUP_20 = 20,
    GROUP_21 = 21,
    GROUP_22 = 22,
    GROUP_23 = 23,
    GROUP_24 = 24
}
/**
 * Phase 2 Diffie-Hellman group numbers
 */
export declare enum Phase2DhGroupNumber {
    GROUP_2 = 2,
    GROUP_5 = 5,
    GROUP_14 = 14,
    GROUP_15 = 15,
    GROUP_16 = 16,
    GROUP_17 = 17,
    GROUP_18 = 18,
    GROUP_19 = 19,
    GROUP_20 = 20,
    GROUP_21 = 21,
    GROUP_22 = 22,
    GROUP_23 = 23,
    GROUP_24 = 24
}
/**
 * Tunnel startup action
 */
export declare enum TunnelStartupAction {
    /**
     * Customer gateway must initiate IKE negotiation
     */
    ADD = "add",
    /**
     * AWS will initiate IKE negotiation
     */
    START = "start"
}

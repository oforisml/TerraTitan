import { instance, launchTemplate } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { AmazonLinuxVirt } from "../machine-image/common";
import { BlockDevice } from "../volume";
export declare function instanceEbsBlockDeviceMappings(construct: Construct, blockDevices: BlockDevice[], tags?: Record<string, string>): instance.InstanceEbsBlockDevice[] | undefined;
export declare function launchTemplateBlockDeviceMappings(construct: Construct, blockDevices: BlockDevice[]): launchTemplate.LaunchTemplateBlockDeviceMappings[] | undefined;
export declare function instanceEphemeralBlockDeviceMappings(blockDevices: BlockDevice[]): instance.InstanceEphemeralBlockDevice[] | undefined;
export declare function instanceRootBlockDeviceMapping(construct: Construct, blockDevices: BlockDevice[], tags?: Record<string, string>): instance.InstanceRootBlockDevice | undefined;
/**
 * Determines if the given device name is the reserved name for root volume.
 *
 * @see https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/device_naming.html#available-ec2-device-names
 */
export declare function isRootBlockDevice(blockDevice: BlockDevice, virtType?: AmazonLinuxVirt): boolean;

import { dataCloudinitConfig } from "@cdktf/provider-cloudinit";
import { IResolvable } from "cdktf";
import { IConstruct } from "constructs";
import { IBucket } from "../storage";
import { OperatingSystemType } from "./machine-image/common";
/**
 * Common UserData Options
 */
export interface UserDataCommon {
    /**
     * Specify whether or not to base64 encode the `rendered` output. Cannot be disabled if gzip is `true`.
     *
     * NOTE: Instance and LaunchTemplate expect base64 encoded user data
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/cloudinit/2.3.6/docs/data-sources/config#base64_encode DataCloudinitConfig#base64_encode}
     * @default true
     */
    readonly base64Encode?: boolean | IResolvable;
    /**
     * Specify whether or not to gzip the `rendered` output.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/cloudinit/2.3.6/docs/data-sources/config#gzip DataCloudinitConfig#gzip}
     * @default true
     */
    readonly gzip?: boolean | IResolvable;
    /**
     * `Content-Type` header of this part.
     *
     * Some examples of content types:
     * * `text/x-shellscript; charset="utf-8"` (shell script)
     * * `text/cloud-boothook; charset="utf-8"` (shell script executed during boot phase)
     *
     * For Linux shell scripts use `text/x-shellscript`.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/cloudinit/2.3.6/docs/data-sources/config#content_type DataCloudinitConfig#content_type}
     *
     * @defaults to `text/plain`
     */
    readonly contentType?: string;
    /**
     * A filename to report in the header for the part.
     *
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/cloudinit/2.3.6/docs/data-sources/config#filename DataCloudinitConfig#filename}
     */
    readonly filename?: string;
}
/**
 * Options when constructing UserData for Linux
 */
export interface LinuxUserDataOptions extends UserDataCommon {
    /**
     * Shebang for the UserData script
     *
     * @default "#!/bin/bash"
     */
    readonly shebang?: string;
}
/**
 * Options when constructing UserData for Windows
 */
export interface WindowsUserDataOptions extends UserDataCommon {
    /**
     * Set to true to set this userdata to persist through an instance reboot; allowing
     * it to run on every instance start.
     * By default, UserData is run only once during the first instance launch.
     *
     * For more information, see:
     * https://aws.amazon.com/premiumsupport/knowledge-center/execute-user-data-ec2/
     * https://docs.aws.amazon.com/AWSEC2/latest/WindowsGuide/ec2-windows-user-data.html#user-data-scripts
     *
     * @default false
     */
    readonly persist?: boolean;
}
/**
 * Options when downloading files from S3
 */
export interface S3DownloadOptions {
    /**
     * Name of the S3 bucket to download from
     */
    readonly bucket: IBucket;
    /**
     * The key of the file to download
     */
    readonly bucketKey: string;
    /**
     * The name of the local file.
     *
     * @default Linux   - /tmp/bucketKey
     *          Windows - %TEMP%/bucketKey
     */
    readonly localFile?: string;
    /**
     * The region of the S3 Bucket (needed for access via VPC Gateway)
     * @default none
     */
    readonly region?: string;
}
/**
 * Options when executing a file.
 */
export interface ExecuteFileOptions {
    /**
     * The path to the file.
     */
    readonly filePath: string;
    /**
     * The arguments to be passed to the file.
     *
     * @default No arguments are passed to the file.
     */
    readonly arguments?: string;
}
/**
 * Instance User Data
 *
 * resource: data_cloudinit_config
 *
 * This is limited to 7bit encoding
 * ref open issue: https://github.com/hashicorp/terraform-provider-cloudinit/pull/170
 */
export declare abstract class UserData {
    /**
     * Create a userdata object for Linux hosts
     */
    static forLinux(options?: LinuxUserDataOptions): UserData;
    /**
     * Create a userdata object for Windows hosts
     */
    static forWindows(options?: WindowsUserDataOptions): UserData;
    /**
     * Create a userdata object with custom content
     */
    static custom(content: string): UserData;
    static forOperatingSystem(os: OperatingSystemType): UserData;
    /** The UserData Content */
    abstract readonly content: string;
    abstract readonly contentType?: string;
    abstract readonly filename?: string;
    protected readonly base64Encode: boolean | IResolvable;
    protected readonly gzip: boolean | IResolvable;
    constructor(userdataOptions?: UserDataCommon);
    /**
     * Add one or more commands to the user data
     */
    abstract addCommands(...commands: string[]): void;
    /**
     * Add one or more commands to the user data that will run when the script exits.
     */
    abstract addOnExitCommands(...commands: string[]): void;
    /**
     * Render the UserData for use in a construct
     */
    abstract render(scope: IConstruct): string;
    /**
     * Adds commands to download a file from S3
     *
     * @returns: The local path that the file will be downloaded to
     */
    abstract addS3DownloadCommand(params: S3DownloadOptions): string;
    /**
     * Adds commands to execute a file
     */
    abstract addExecuteFileCommand(params: ExecuteFileOptions): void;
}
/**
 * The base class for all classes which can be used as `MultipartUserData`.
 */
export declare abstract class MultipartBody {
    /**
     * Content type for shell scripts
     */
    static readonly SHELL_SCRIPT = "text/x-shellscript; charset=\"utf-8\"";
    /**
     * Content type for boot hooks
     */
    static readonly CLOUD_BOOTHOOK = "text/cloud-boothook; charset=\"utf-8\"";
    /**
     * Constructs the new `MultipartBody` wrapping existing `UserData`. Modification to `UserData` are reflected
     * in subsequent renders of the part.
     *
     * For more information about content types see `MultipartBodyOptions.contentType`.
     *
     * @param userData user data to wrap into body part
     * @param contentType optional content type, if default one should not be used
     */
    static fromUserData(userData: UserData, contentType?: string): MultipartBody;
    /**
    * When transfer encoding is specified (typically as Base64), it's caller responsibility to convert body to
    * Base64 either by wrapping with `Fn.base64` or by converting it by other converters.
    *
    * Note: https://github.com/hashicorp/terraform-provider-cloudinit/pull/170
    * /
  
    /**
     * Constructs the raw `MultipartBody` using specified body, content type, filename and merge type
     */
    static fromRawBody(opts: dataCloudinitConfig.DataCloudinitConfigPart): MultipartBody;
    constructor();
    /**
     * Render body part
     */
    abstract renderBodyPart(): dataCloudinitConfig.DataCloudinitConfigPart;
}
/**
 * Options for creating `MultipartUserData`
 */
export interface MultipartUserDataOptions extends UserDataCommon {
    /**
     * The string used to separate parts in multipart user data archive (it's like MIME boundary).
     *
     * This string should contain [a-zA-Z0-9()+,-./:=?] characters only, and should not be present in any part, or in text content of archive.
     *
     * @default `+AWS+CDK+User+Data+Separator==`
     */
    readonly partsSeparator?: string;
}
/**
 * Mime multipart user data.
 *
 * This class represents MIME multipart user data, as described in.
 * [Specifying Multiple User Data Blocks Using a MIME Multi Part Archive](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/bootstrap_container_instance.html#multi-part_user_data)
 *
 */
export declare class MultipartUserData extends UserData {
    private static readonly USE_PART_ERROR;
    private static readonly BOUNDRY_PATTERN;
    private parts;
    private opts;
    private defaultUserData?;
    readonly contentType?: string;
    readonly filename?: string;
    constructor(opts?: MultipartUserDataOptions);
    /**
     * Adds a part to the list of parts.
     */
    addPart(part: MultipartBody): void;
    /**
     * Adds a multipart part based on a UserData object.
     *
     * If `makeDefault` is true, then the UserData added by this method
     * will also be the target of calls to the `add*Command` methods on
     * this MultipartUserData object.
     *
     * If `makeDefault` is false, then this is the same as calling:
     *
     * ```ts
     * declare const multiPart: compute.MultipartUserData;
     * declare const userData: compute.UserData;
     * declare const contentType: string;
     *
     * multiPart.addPart(compute.MultipartBody.fromUserData(userData, contentType));
     * ```
     *
     * An undefined `makeDefault` defaults to either:
     * - `true` if no default UserData has been set yet; or
     * - `false` if there is no default UserData set.
     */
    addUserDataPart(userData: UserData, contentType?: string, makeDefault?: boolean): void;
    /**
     * The content of the default UserData.
     */
    get content(): string;
    render(scope: IConstruct): string;
    addS3DownloadCommand(params: S3DownloadOptions): string;
    addExecuteFileCommand(params: ExecuteFileOptions): void;
    addCommands(...commands: string[]): void;
    addOnExitCommands(...commands: string[]): void;
}

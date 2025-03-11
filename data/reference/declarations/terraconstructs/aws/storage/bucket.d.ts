import { s3Bucket, s3BucketCorsConfiguration, s3BucketWebsiteConfiguration, dataAwsS3Bucket } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { WebsiteConfig, CorsConfig, LifecycleConfigurationRule, OriginAccessIdentity, BucketPolicy, IBucketNotificationDestination } from ".";
import { AwsConstructBase, IAwsConstruct, AwsConstructProps } from "../aws-construct";
import * as kms from "../encryption";
import * as iam from "../iam";
export interface CloudfrontAccessConfig {
    /**
     * Enable Cloudfront access via Origin Access Identity.
     */
    readonly enabled: boolean;
    /**
     * Object key patterns for cloudfront access.
     *
     * @default "*"
     */
    readonly keyPatterns?: string[];
}
/**
 * A reference to a bucket outside this stack
 */
export interface BucketAttributes {
    /**
     * The ARN of the bucket. At least one of bucketArn or bucketName must be
     * defined in order to initialize a bucket ref.
     */
    readonly bucketArn?: string;
    /**
     * The name of the bucket. If the underlying value of ARN is a string, the
     * name will be parsed from the ARN. Otherwise, the name is optional, but
     * some features that require the bucket name such as auto-creating a bucket
     * policy, won't work.
     */
    readonly bucketName?: string;
    /**
     * The domain name of the bucket.
     *
     * @default - Inferred from bucket name
     */
    readonly bucketDomainName?: string;
    /**
     * The website URL of the bucket (if static web hosting is enabled).
     *
     * @default - Inferred from bucket name and region
     */
    readonly bucketWebsiteUrl?: string;
    /**
     * The regional domain name of the specified bucket.
     */
    readonly bucketRegionalDomainName?: string;
    /**
     * The IPv6 DNS name of the specified bucket.
     */
    readonly bucketDualStackDomainName?: string;
    /**
     * KMS encryption key associated with this bucket.
     *
     * @default - no encryption key
     */
    readonly encryptionKey?: kms.IKey;
    /**
     * If this bucket has been configured for static website hosting.
     *
     * @default false
     */
    readonly isWebsite?: boolean;
    /**
     * The account this existing bucket belongs to.
     *
     * @default - it's assumed the bucket belongs to the same account as the scope it's being imported into
     */
    readonly account?: string;
    /**
     * The region this existing bucket is in.
     * Features that require the region (e.g. `bucketWebsiteUrl`) won't fully work
     * if the region cannot be correctly inferred.
     *
     * @default - it's assumed the bucket is in the same region as the scope it's being imported into
     */
    readonly region?: string;
    /**
     * Whether the bucket is public or not.
     *
     * @default false
     */
    readonly public?: boolean;
    /**
     * Whether the bucket has versioning enabled
     *
     * If you are enabling versioning on the bucket for the first time, AWS recommends that
     * you wait for 15 minutes after enabling versioning before issuing write operations
     * (PUT or DELETE) on objects in the bucket.
     *
     * This will cause 15m delay if `path` is configured.
     *
     * @default false
     */
    readonly versioned?: boolean;
    /**
     * Special CloudFront user that you can associate with Amazon S3 origins, so that you can secure all or just some of
     * your Amazon S3 content.
     *
     * Required to use the imported bucket in a CloudFront distribution.
     */
    readonly originAccessIdentity?: OriginAccessIdentity;
}
export interface BucketProps extends AwsConstructProps {
    /**
     * The kind of server-side encryption to apply to this bucket.
     *
     * If you choose KMS, you can specify a KMS key via `encryptionKey`. If
     * encryption key is not specified, a key will automatically be created.
     *
     * @default - `KMS` if `encryptionKey` is specified, or `UNENCRYPTED` otherwise.
     * But if `UNENCRYPTED` is specified, the bucket will be encrypted as `S3_MANAGED` automatically.
     */
    readonly encryption?: BucketEncryption;
    /**
     * External KMS key to use for bucket encryption.
     *
     * The `encryption` property must be either not specified or set to `KMS` or `DSSE`.
     * An error will be emitted if `encryption` is set to `UNENCRYPTED` or `S3_MANAGED`.
     *
     * @default - If `encryption` is set to `KMS` and this property is undefined,
     * a new KMS key will be created and associated with this bucket.
     */
    readonly encryptionKey?: kms.IKey;
    /**
     * Whether Amazon S3 should use its own intermediary key to generate data keys.
     *
     * Only relevant when using KMS for encryption.
     *
     * - If not enabled, every object GET and PUT will cause an API call to KMS (with the
     *   attendant cost implications of that).
     * - If enabled, S3 will use its own time-limited key instead.
     *
     * Only relevant, when Encryption is not set to `BucketEncryption.UNENCRYPTED`.
     *
     * @default - false
     */
    readonly bucketKeyEnabled?: boolean;
    /**
     * The path(s) to static directories or files to upload, relative to the Stack file.
     *
     * @example "./dist"
     * @default - No files are uploaded.
     */
    readonly sources?: string | string[] | AddSourceOptions[];
    /**
     * Enable public read access for all the files in the bucket.
     *
     * Enable this only if you're not using CDN (CloudFront) to serve files from the bucket.
     * Should only be turned on if you want to host public files directly from the bucket.
     *
     * @default `false`
     */
    readonly public?: boolean;
    /**
     * A name for the bucket.
     *
     * Must be lowercase and between 3 (min) and 63 (max) characters long.
     *
     * The name must not be in the format [bucket_name]--[azid]--x-s3. Use the
     * `aws_s3_directory_bucket` resource to manage S3 Express buckets.
     *
     * A full list of bucket naming rules [may be found here](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucketnamingrules.html).
     *
     * @default - If omitted, Refer to `namePrefix`.
     */
    readonly bucketName?: string;
    /**
     * Creates a unique name beginning with the specified prefix.
     * Conflicts with `bucketName`.
     *
     * Terraform Prefixes must reserve 26 characters for the terraform generated suffix.
     *
     * @default - If omitted, ET will assign a random, unique name prefixed by GridUUID.
     */
    readonly namePrefix?: string;
    /**
     * Boolean that indicates all objects (including any locked objects)
     * should be deleted from the bucket when the bucket is destroyed
     * so that the bucket can be destroyed without error.
     *
     * These objects are not recoverable. This only deletes objects when
     * the bucket is destroyed, not when setting this parameter to true.
     *
     * Once this parameter is set to true, there must be a successful
     * terraform apply run before a destroy is required to update this
     * value in the resource state.
     *
     * Without a successful terraform apply after this parameter is set,
     * this flag will have no effect. If setting this field in the same
     * operation that would require replacing the bucket or destroying
     * the bucket, this flag will not work.
     *
     * Additionally when importing a bucket, a successful terraform apply
     * is required to set this value in state before it will take effect
     * on a destroy operation.
     *
     * @default false
     */
    readonly forceDestroy?: boolean;
    /**
     * Provides an S3 bucket website configuration resource.
     *
     * Important: Amazon S3 website endpoints do not support HTTPS or access points.
     * If you want to use HTTPS, you can use edge Distribution to serve a static
     * website hosted in a bucket.
     *
     * Use OriginAccessIdentity property to control ingress through edge Distribution.
     *
     * For more information, see [Hosting Websites on S3](https://docs.aws.amazon.com/AmazonS3/latest/dev/WebsiteHosting.html).
     */
    readonly websiteConfig?: WebsiteConfig;
    /**
     * Provides an S3 bucket CORS configuration resource.
     *
     * For more information about CORS, go to
     * [Enabling Cross-Origin Resource Sharing](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
     * in the Amazon S3 User Guide.
     */
    readonly corsConfig?: CorsConfig;
    /**
     * One or more Lifecycle rules. Each rule consists of the following:
     *
     *  - Rule id
     *  - Filter identifying objects to which the rule applies
     *  - One or more transition or expiration actions
     *
     * For more information see the Amazon S3 User Guide on [Lifecycle Configuration Elements](https://docs.aws.amazon.com/AmazonS3/latest/userguide/intro-lifecycle-rules.html).
     */
    readonly lifecycleRules?: LifecycleConfigurationRule[];
    /**
     * Controls versioning on the S3 bucket.
     *
     * Setting this to false will suspend versioning if the associated S3 bucket is versioned.
     *
     * If you are enabling versioning on the bucket for the first time, AWS recommends that you wait for 15 minutes after enabling versioning before issuing write operations (PUT or DELETE) on objects in the bucket.
     * This will cause 15m delay if `path` is configured.
     *
     * @default false
     */
    readonly versioned?: boolean;
    /**
     * Whether this bucket should send notifications to Amazon EventBridge or not.
     *
     * @default false
     */
    readonly eventBridgeEnabled?: boolean;
    /**
     * Enforces SSL for requests. S3.5 of the AWS Foundational Security Best Practices Regarding S3.
     * @see https://docs.aws.amazon.com/config/latest/developerguide/s3-bucket-ssl-requests-only.html
     *
     * @default false
     */
    readonly enforceSSL?: boolean;
    /**
     * Enforces minimum TLS version for requests.
     *
     * Requires `enforceSSL` to be enabled.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/amazon-s3-policy-keys.html#example-object-tls-version
     *
     * @default No minimum TLS version is enforced.
     */
    readonly minimumTLSVersion?: number;
    /**
     * Enable Cloudfront access via Origin Access Identity.
     *
     * Note: recommended to migrate to OAC in future.
     *
     * @default - no cloudfront access
     */
    readonly cloudfrontAccess?: CloudfrontAccessConfig;
}
/**
 * Outputs which may be registered for output via the Grid.
 */
export interface BucketOutputs {
    /**
     * AWS Bucket name
     * @attribute
     */
    readonly name: string;
    /**
     * AWS Bucket arn
     * @attribute
     */
    readonly arn: string;
    /**
     * The URL of the static website.
     * @attribute
     */
    readonly websiteUrl?: string;
    /**
     * The Domain name of the static website.
     * @attribute
     */
    readonly websiteDomainName?: string;
    /**
     * The IPv4 DNS name of the specified bucket.
     * @attribute
     */
    readonly domainName: string;
    /**
     * The regional domain name of the specified bucket.
     * @attribute
     */
    readonly regionalDomainName: string;
    /**
     * Origin Access Identity, if cloudfrontAccess is enabled.
     * @attribute
     */
    readonly originAccessIdentity?: string;
    /**
     * Kms Key outputs, if bucket has encryption.
     * @attribute
     */
    readonly encryptionKey?: kms.KeyOutputs;
}
/**
 * Imported or created Bucket attributes
 */
export interface IBucket extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly bucketOutputs: BucketOutputs;
    /**
     * AWS Bucket name
     */
    readonly bucketName: string;
    /**
     * AWS Bucket arn
     */
    readonly bucketArn: string;
    /** Whether the bucket has versioning enabled */
    readonly versioned: boolean;
    /** The hosted Zone Id for the bucket */
    readonly hostedZoneId: string;
    /**
     * The Domain name of the static website.
     *
     * This is used to create Route 53 alias records.
     * @attribute
     */
    readonly websiteDomainName?: string;
    /**
     * Whether the bucket is public or not.
     */
    readonly public?: boolean;
    /**
     * Optional KMS encryption key associated with this bucket.
     */
    readonly encryptionKey?: kms.IKey;
    /**
     * The resource policy associated with this bucket.
     *
     * If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
     * first call to addToResourcePolicy(s).
     */
    policy?: BucketPolicy;
    /**
     * Add a source of files for upload to the bucket.
     */
    addSource(props: AddSourceOptions, sourceId?: string): string;
    /**
     * If this bucket has been configured for static website hosting.
     */
    isWebsite(): this is {
        websiteDomainName: string;
        bucketOutputs: {
            websiteUrl: string;
            websiteDomainName: string;
        };
    };
    /**
     * The https URL of an S3 object. For example:
     *
     * - `https://s3.us-west-1.amazonaws.com/onlybucket`
     * - `https://s3.us-west-1.amazonaws.com/bucket/key`
     * - `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`
     * @param key The S3 key of the object. If not specified, the URL of the
     *      bucket is returned.
     * @returns an ObjectS3Url token
     */
    urlForObject(key?: string): string;
    /**
     * The S3 URL of an S3 object. For example:
     * - `s3://onlybucket`
     * - `s3://bucket/key`
     * @param key The S3 key of the object. If not specified, the S3 URL of the
     *      bucket is returned.
     * @returns an ObjectS3Url token
     */
    s3UrlForObject(key?: string): string;
    /**
     * Returns an ARN that represents all objects within the bucket that match
     * the key pattern specified. To represent all keys, specify ``"*"``.
     */
    arnForObjects(keyPattern: string): string;
    /**
     * Adds a statement to the resource policy for a principal (i.e.
     * account/role/service) to perform actions on this bucket and/or its
     * contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for
     * this bucket or objects.
     *
     * Note that the policy statement may or may not be added to the policy.
     * For example, when an `IBucket` is created from an existing bucket,
     * it's not possible to tell whether the bucket already has a policy
     * attached, let alone to re-use that policy to add more statements to it.
     * So it's safest to do nothing in these cases.
     *
     * @param permission the policy statement to be added to the bucket's
     * policy.
     * @returns metadata about the execution of this method. If the policy
     * was not added, the value of `statementAdded` will be `false`. You
     * should always check this value to make sure that the operation was
     * actually carried out. Otherwise, synthesis and deploy will terminate
     * silently, which may be confusing.
     */
    addToResourcePolicy(permission: iam.PolicyStatement): iam.AddToResourcePolicyResult;
    /**
     * Grant read permissions for this bucket and it's contents to an IAM
     * principal (Role/Group/User).
     *
     * If encryption is used, permission to use the key to decrypt the contents
     * of the bucket will also be granted to the same principal.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantRead(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    /**
     * Grant write permissions to this bucket to an IAM principal.
     *
     * If encryption is used, permission to use the key to encrypt the contents
     * of written files will also be granted to the same principal.
     *
     * This does not include `s3:PutObjectAcl`, which could be used to grant read/write object access to IAM principals in other accounts.
     *
     * If you need the principal to have permissions to modify the ACLs,
     * use the `grantPutAcl` method.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     * @param allowedActionPatterns Restrict the permissions to certain list of action patterns
     */
    grantWrite(identity: iam.IGrantable, objectsKeyPattern?: any, allowedActionPatterns?: string[]): iam.Grant;
    /**
     * Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.
     *
     * If encryption is used, permission to use the key to encrypt the contents
     * of written files will also be granted to the same principal.
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantPut(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    /**
     * Grant the given IAM identity permissions to modify the ACLs of objects in the given Bucket.
     *
     * calling `grantWrite` or `grantReadWrite` does not grant permissions to modify the ACLs of the objects;
     * in this case, if you need to modify object ACLs, call this method explicitly.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*')
     */
    grantPutAcl(identity: iam.IGrantable, objectsKeyPattern?: string): iam.Grant;
    /**
     * Grants s3:DeleteObject* permission to an IAM principal for objects
     * in this bucket.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantDelete(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    /**
     * Grants read/write permissions for this bucket and it's contents to an IAM
     * principal (Role/Group/User).
     *
     * If an encryption key is used, permission to use the key for
     * encrypt/decrypt will also be granted.
     *
     * This does not include `s3:PutObjectAcl`, which could be used to grant read/write object access to IAM principals in other accounts.
     *
     * If you need the principal to have permissions to modify the ACLs,
     * use the `grantPutAcl` method.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantReadWrite(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    /**
     * Adds a bucket notification event destination.
     * @param event The event to trigger the notification
     * @param dest The notification destination (Lambda, SNS Topic or SQS Queue)
     *
     * @param filters S3 object key filter rules to determine which objects
     * trigger this event. Each filter must include a `prefix` and/or `suffix`
     * that will be matched against the s3 object key. Refer to the S3 Developer Guide
     * for details about allowed filter rules.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html#notification-how-to-filtering
     *
     * @example
     *
     *    declare const myLambda: lambda.Function;
     *    const bucket = new s3.Bucket(this, 'MyBucket');
     *    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(myLambda), {prefix: 'home/myusername/*'})
     *
     * @see
     * https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html
     */
    addEventNotification(event: EventType, dest: IBucketNotificationDestination, ...filters: NotificationKeyFilter[]): void;
    /**
     * Subscribes a destination to receive notifications when an object is
     * created in the bucket. This is identical to calling
     * `onEvent(s3.EventType.OBJECT_CREATED)`.
     *
     * @param dest The notification destination (see onEvent)
     * @param filters Filters (see onEvent)
     */
    addObjectCreatedNotification(dest: IBucketNotificationDestination, ...filters: NotificationKeyFilter[]): void;
    /**
     * Subscribes a destination to receive notifications when an object is
     * removed from the bucket. This is identical to calling
     * `onEvent(EventType.OBJECT_REMOVED)`.
     *
     * @param dest The notification destination (see onEvent)
     * @param filters Filters (see onEvent)
     */
    addObjectRemovedNotification(dest: IBucketNotificationDestination, ...filters: NotificationKeyFilter[]): void;
    /**
     * Enables event bridge notification, causing all events below to be sent to EventBridge:
     *
     * - Object Deleted (DeleteObject)
     * - Object Deleted (Lifecycle expiration)
     * - Object Restore Initiated
     * - Object Restore Completed
     * - Object Restore Expired
     * - Object Storage Class Changed
     * - Object Access Tier Changed
     * - Object ACL Updated
     * - Object Tags Added
     * - Object Tags Deleted
     */
    enableEventBridgeNotification(): void;
}
export declare abstract class BucketBase extends AwsConstructBase implements IBucket {
    abstract readonly bucketArn: string;
    abstract readonly bucketName: string;
    abstract readonly websiteDomainName?: string;
    abstract readonly websiteEndpoint?: string;
    abstract readonly public?: boolean;
    abstract readonly versioned: boolean;
    abstract readonly hostedZoneId: string;
    /**
     * Optional KMS encryption key associated with this bucket.
     */
    abstract readonly encryptionKey?: kms.IKey;
    get bucketOutputs(): BucketOutputs;
    get outputs(): Record<string, any>;
    protected abstract readonly resource: s3Bucket.S3Bucket | dataAwsS3Bucket.DataAwsS3Bucket;
    protected abstract readonly originAccessIdentity?: OriginAccessIdentity;
    /** @internal */
    protected abstract readonly _isWebsite: boolean;
    /** @internal */
    private sourceSleep?;
    /** @internal */
    private readonly sources;
    /**
     * The resource policy associated with this bucket.
     *
     * If `autoCreatePolicy` is true, a `BucketPolicy` will be created upon the
     * first call to addToResourcePolicy(s).
     */
    abstract policy?: BucketPolicy;
    /**
     * Indicates if a bucket resource policy should automatically created upon
     * the first call to `addToResourcePolicy`.
     */
    protected abstract autoCreatePolicy: boolean;
    private notifications?;
    protected notificationsHandlerRole?: iam.IRole;
    protected notificationsSkipDestinationValidation?: boolean;
    constructor(scope: Construct, id: string, props?: AwsConstructProps);
    /**
     * Adds a statement to the resource policy for a principal (i.e.
     * account/role/service) to perform actions on this bucket and/or its
     * contents. Use `bucketArn` and `arnForObjects(keys)` to obtain ARNs for
     * this bucket or objects.
     *
     * Note that the policy statement may or may not be added to the policy.
     * For example, when an `IBucket` is created from an existing bucket,
     * it's not possible to tell whether the bucket already has a policy
     * attached, let alone to re-use that policy to add more statements to it.
     * So it's safest to do nothing in these cases.
     *
     * @param permission the policy statement to be added to the bucket's
     * policy.
     * @returns metadata about the execution of this method. If the policy
     * was not added, the value of `statementAdded` will be `false`. You
     * should always check this value to make sure that the operation was
     * actually carried out. Otherwise, synthesis and deploy will terminate
     * silently, which may be confusing.
     */
    addToResourcePolicy(permission: iam.PolicyStatement): iam.AddToResourcePolicyResult;
    /**
     * Grant read permissions for this bucket and it's contents to an IAM
     * principal (Role/Group/User).
     *
     * If encryption is used, permission to use the key to decrypt the contents
     * of the bucket will also be granted to the same principal.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantRead(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    grantWrite(identity: iam.IGrantable, objectsKeyPattern?: any, allowedActionPatterns?: string[]): iam.Grant;
    /**
     * Grants s3:PutObject* and s3:Abort* permissions for this bucket to an IAM principal.
     *
     * If encryption is used, permission to use the key to encrypt the contents
     * of written files will also be granted to the same principal.
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantPut(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    grantPutAcl(identity: iam.IGrantable, objectsKeyPattern?: string): iam.Grant;
    /**
     * Grants s3:DeleteObject* permission to an IAM principal for objects
     * in this bucket.
     *
     * @param identity The principal
     * @param objectsKeyPattern Restrict the permission to a certain key pattern (default '*'). Parameter type is `any` but `string` should be passed in.
     */
    grantDelete(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    grantReadWrite(identity: iam.IGrantable, objectsKeyPattern?: any): iam.Grant;
    /**
     * Adds a bucket notification event destination.
     *
     * S3 Buckets only support a single notification configuration resource.
     * Declaring multiple `aws_s3_bucket_notification` resources to the same
     * S3 Bucket will cause a perpetual difference in configuration.
     *
     * Calling this function will overwrite any existing event notifications configured
     * for the S3 bucket outside of this beacon.
     *
     * @param event The event to trigger the notification
     * @param dest The notification destination (Lambda, SNS Topic or SQS Queue)
     *
     * @param filters S3 object key filter rules to determine which objects
     * trigger this event. Each filter must include a `prefix` and/or `suffix`
     * that will be matched against the s3 object key. Refer to the S3 Developer Guide
     * for details about allowed filter rules.
     *
     * @see https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html#notification-how-to-filtering
     *
     * @example
     *
     *    declare const myFunction: compute.Function;
     *    const bucket = new storage.Bucket(this, 'MyBucket');
     *    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.LambdaDestination(myFunction), {prefix: 'home/myusername/*'});
     *
     * @see
     * https://docs.aws.amazon.com/AmazonS3/latest/dev/NotificationHowTo.html
     */
    addEventNotification(event: EventType, dest: IBucketNotificationDestination, ...filters: NotificationKeyFilter[]): void;
    private withNotifications;
    /**
     * Subscribes a destination to receive notifications when an object is
     * created in the bucket. This is identical to calling
     * `onEvent(EventType.OBJECT_CREATED)`.
     *
     * @param dest The notification destination (see onEvent)
     * @param filters Filters (see onEvent)
     */
    addObjectCreatedNotification(dest: IBucketNotificationDestination, ...filters: NotificationKeyFilter[]): void;
    /**
     * Subscribes a destination to receive notifications when an object is
     * removed from the bucket. This is identical to calling
     * `onEvent(EventType.OBJECT_REMOVED)`.
     *
     * @param dest The notification destination (see onEvent)
     * @param filters Filters (see onEvent)
     */
    addObjectRemovedNotification(dest: IBucketNotificationDestination, ...filters: NotificationKeyFilter[]): void;
    /**
     * Enables event bridge notification, causing all events below to be sent to EventBridge:
     *
     * - Object Deleted (DeleteObject)
     * - Object Deleted (Lifecycle expiration)
     * - Object Restore Initiated
     * - Object Restore Completed
     * - Object Restore Expired
     * - Object Storage Class Changed
     * - Object Access Tier Changed
     * - Object ACL Updated
     * - Object Tags Added
     * - Object Tags Deleted
     */
    enableEventBridgeNotification(): void;
    private grant;
    private get writeActions();
    /**
     * Add a source to the bucket.
     *
     * @param props The properties of the source to add
     */
    addSource(props: AddSourceOptions, sourceId?: string): string;
    isWebsite(): this is {
        websiteDomainName: string;
        bucketOutputs: {
            websiteUrl: string;
            websiteDomainName: string;
        };
    };
    /**
     * The https URL of an S3 object. Specify `regional: false` at the options
     * for non-regional URLs. For example:
     *
     * - `https://s3.us-west-1.amazonaws.com/onlybucket`
     * - `https://s3.us-west-1.amazonaws.com/bucket/key`
     * - `https://s3.cn-north-1.amazonaws.com.cn/china-bucket/mykey`
     *
     * @param key The S3 key of the object. If not specified, the URL of the
     *      bucket is returned.
     * @returns an ObjectS3Url token
     */
    urlForObject(key?: string): string;
    /**
     * The S3 URL of an S3 object. For example:
     *
     * - `s3://onlybucket`
     * - `s3://bucket/key`
     *
     * @param key The S3 key of the object. If not specified, the S3 URL of the
     *      bucket is returned.
     * @returns an ObjectS3Url token
     */
    s3UrlForObject(key?: string): string;
    /**
     * Returns an ARN that represents all objects within the bucket that match
     * the key pattern specified. To represent all keys, specify ``"*"``.
     *
     * If you need to specify a keyPattern with multiple components, concatenate them into a single string, e.g.:
     *
     *   arnForObjects(`home/${team}/${user}/*`)
     *
     */
    arnForObjects(keyPattern: string): string;
    private urlJoin;
    /**
     * Adds resource to the Terraform JSON output at Synth time.
     *
     * called by TerraformStack.prepareStack()
     */
    toTerraform(): any;
}
/**
 * The `Bucket` provides an [AWS S3 Bucket](https://aws.amazon.com/s3/).
 *
 * ```ts
 * new storage.Bucket(stack, "MyWebsite", {
 *   path: path.join(__dirname, "dist"),
 * });
 * ```
 *
 * #### Public read access
 *
 * Enables `public` read access for all the files in the bucket. Dangerous and
 * recommended to use edge.Distribution instead.
 *
 * Useful for hosting public files directly from S3.
 *
 * ```ts
 * new storage.Bucket("MyBucket", {
 *   public: true
 * });
 * ```
 *
 * @resource aws_s3_bucket
 * @terraconstruct storage.IBucket
 */
export declare class Bucket extends BucketBase implements IBucket {
    static fromBucketName(scope: Construct, id: string, bucketName: string): IBucket;
    /**
     * Creates a Bucket construct that represents an external bucket.
     *
     * @param scope The parent creating construct (usually `this`).
     * @param id The construct's name.
     * @param attrs A `BucketAttributes` object. Can be obtained from a call to
     * `bucket.export()` or manually created.
     */
    static fromBucketAttributes(scope: Construct, id: string, attrs: BucketAttributes): IBucket;
    /**
     * Thrown an exception if the given bucket name is not valid.
     *
     * @param physicalName name of the bucket.
     * @param allowLegacyBucketNaming allow legacy bucket naming style, default is false.
     */
    static validateBucketName(physicalName: string, allowLegacyBucketNaming?: boolean): void;
    readonly encryptionKey?: kms.IKey;
    protected readonly resource: s3Bucket.S3Bucket | dataAwsS3Bucket.DataAwsS3Bucket;
    protected readonly websiteConfig?: s3BucketWebsiteConfiguration.S3BucketWebsiteConfiguration;
    protected readonly corsConfig?: s3BucketCorsConfiguration.S3BucketCorsConfiguration;
    protected readonly originAccessIdentity?: OriginAccessIdentity;
    /** @internal */
    protected readonly _isWebsite: boolean;
    /** @internal */
    private readonly _versioned;
    get bucketArn(): string;
    get bucketName(): string;
    get websiteDomainName(): string | undefined;
    get websiteEndpoint(): string | undefined;
    get versioned(): boolean;
    get hostedZoneId(): string;
    policy?: BucketPolicy;
    protected autoCreatePolicy: boolean;
    /**
     * Whether the bucket is public or not.
     */
    readonly public?: boolean;
    private readonly eventBridgeEnabled?;
    constructor(scope: Construct, name: string, props?: BucketProps);
    /**
     * Set up key properties and return the Bucket encryption property from the
     * user's configuration, according to the following table:
     *
     * | props.encryption | props.encryptionKey | props.bucketKeyEnabled | bucketEncryption (return value) | encryptionKey (return value) |
     * |------------------|---------------------|------------------------|---------------------------------|------------------------------|
     * | undefined        | undefined           | e                      | undefined                       | undefined                    |
     * | UNENCRYPTED      | undefined           | false                  | undefined                       | undefined                    |
     * | undefined        | k                   | e                      | SSE-KMS, bucketKeyEnabled = e   | k                            |
     * | KMS              | k                   | e                      | SSE-KMS, bucketKeyEnabled = e   | k                            |
     * | KMS              | undefined           | e                      | SSE-KMS, bucketKeyEnabled = e   | new key                      |
     * | KMS_MANAGED      | undefined           | e                      | SSE-KMS, bucketKeyEnabled = e   | undefined                    |
     * | S3_MANAGED       | undefined           | false                  | SSE-S3                          | undefined                    |
     * | S3_MANAGED       | undefined           | e                      | SSE-S3, bucketKeyEnabled = e    | undefined                    |
     * | UNENCRYPTED      | undefined           | true                   | ERROR!                          | ERROR!                       |
     * | UNENCRYPTED      | k                   | e                      | ERROR!                          | ERROR!                       |
     * | KMS_MANAGED      | k                   | e                      | ERROR!                          | ERROR!                       |
     * | S3_MANAGED       | undefined           | true                   | ERROR!                          | ERROR!                       |
     * | S3_MANAGED       | k                   | e                      | ERROR!                          | ERROR!                       |
     */
    private parseEncryption;
    /**
     * Adds an iam statement to enforce SSL requests only.
     */
    private enforceSSLStatement;
    /**
     * Adds an iam statement to allow requests with a minimum TLS
     * version only.
     */
    private minimumTLSVersionStatement;
}
export interface AddSourceOptions {
    /**
     * Local path to the source files
     */
    readonly path: string;
    /**
     * Prefix to add to the uploaded objects
     */
    readonly prefix?: string;
}
/**
 * Storage class to move an object to
 */
export declare enum StorageClass {
    /**
     * Storage class for data that is accessed less frequently, but requires rapid
     * access when needed.
     *
     * Has lower availability than Standard storage.
     */
    INFREQUENT_ACCESS = "STANDARD_IA",
    /**
     * Infrequent Access that's only stored in one availability zone.
     *
     * Has lower availability than standard InfrequentAccess.
     */
    ONE_ZONE_INFREQUENT_ACCESS = "ONEZONE_IA",
    /**
     * Storage class for long-term archival that can take between minutes and
     * hours to access.
     *
     * Use for archives where portions of the data might need to be retrieved in
     * minutes. Data stored in the GLACIER storage class has a minimum storage
     * duration period of 90 days and can be accessed in as little as 1-5 minutes
     * using expedited retrieval. If you delete an object before the 90-day
     * minimum, you are charged for 90 days.
     */
    GLACIER = "GLACIER",
    /**
     * Storage class for long-term archival that can be accessed in a few milliseconds.
     *
     * It is ideal for data that is accessed once or twice per quarter, and
     * that requires immediate access. Data stored in the GLACIER_IR storage class
     * has a minimum storage duration period of 90 days and can be accessed in
     * as milliseconds. If you delete an object before the 90-day minimum,
     * you are charged for 90 days.
     */
    GLACIER_INSTANT_RETRIEVAL = "GLACIER_IR",
    /**
     * Use for archiving data that rarely needs to be accessed. Data stored in the
     * DEEP_ARCHIVE storage class has a minimum storage duration period of 180
     * days and a default retrieval time of 12 hours. If you delete an object
     * before the 180-day minimum, you are charged for 180 days. For pricing
     * information, see Amazon S3 Pricing.
     */
    DEEP_ARCHIVE = "DEEP_ARCHIVE",
    /**
     * The INTELLIGENT_TIERING storage class is designed to optimize storage costs
     * by automatically moving data to the most cost-effective storage access
     * tier, without performance impact or operational overhead.
     * INTELLIGENT_TIERING delivers automatic cost savings by moving data on a
     * granular object level between two access tiers, a frequent access tier and
     * a lower-cost infrequent access tier, when access patterns change. The
     * INTELLIGENT_TIERING storage class is ideal if you want to optimize storage
     * costs automatically for long-lived data when access patterns are unknown or
     * unpredictable.
     */
    INTELLIGENT_TIERING = "INTELLIGENT_TIERING"
}
/**
 * What kind of server-side encryption to apply to this bucket
 */
export declare enum BucketEncryption {
    /**
     * Previous option. Buckets can not be unencrypted now.
     * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/serv-side-encryption.html
     * @deprecated S3 applies server-side encryption with SSE-S3 for every bucket
     * that default encryption is not configured.
     */
    UNENCRYPTED = "UNENCRYPTED",
    /**
     * Server-side KMS encryption with a master key managed by KMS.
     */
    KMS_MANAGED = "KMS_MANAGED",
    /**
     * Server-side encryption with a master key managed by S3.
     */
    S3_MANAGED = "S3_MANAGED",
    /**
     * Server-side encryption with a KMS key managed by the user.
     * If `encryptionKey` is specified, this key will be used, otherwise, one will be defined.
     */
    KMS = "KMS",
    /**
     * Double server-side KMS encryption with a master key managed by KMS.
     */
    DSSE_MANAGED = "DSSE_MANAGED",
    /**
     * Double server-side encryption with a KMS key managed by the user.
     * If `encryptionKey` is specified, this key will be used, otherwise, one will be defined.
     */
    DSSE = "DSSE"
}
/**
 * Notification event types.
 * @link https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html#supported-notification-event-types
 */
export declare enum EventType {
    /**
     * Amazon S3 APIs such as PUT, POST, and COPY can create an object. Using
     * these event types, you can enable notification when an object is created
     * using a specific API, or you can use the s3:ObjectCreated:* event type to
     * request notification regardless of the API that was used to create an
     * object.
     */
    OBJECT_CREATED = "s3:ObjectCreated:*",
    /**
     * Amazon S3 APIs such as PUT, POST, and COPY can create an object. Using
     * these event types, you can enable notification when an object is created
     * using a specific API, or you can use the s3:ObjectCreated:* event type to
     * request notification regardless of the API that was used to create an
     * object.
     */
    OBJECT_CREATED_PUT = "s3:ObjectCreated:Put",
    /**
     * Amazon S3 APIs such as PUT, POST, and COPY can create an object. Using
     * these event types, you can enable notification when an object is created
     * using a specific API, or you can use the s3:ObjectCreated:* event type to
     * request notification regardless of the API that was used to create an
     * object.
     */
    OBJECT_CREATED_POST = "s3:ObjectCreated:Post",
    /**
     * Amazon S3 APIs such as PUT, POST, and COPY can create an object. Using
     * these event types, you can enable notification when an object is created
     * using a specific API, or you can use the s3:ObjectCreated:* event type to
     * request notification regardless of the API that was used to create an
     * object.
     */
    OBJECT_CREATED_COPY = "s3:ObjectCreated:Copy",
    /**
     * Amazon S3 APIs such as PUT, POST, and COPY can create an object. Using
     * these event types, you can enable notification when an object is created
     * using a specific API, or you can use the s3:ObjectCreated:* event type to
     * request notification regardless of the API that was used to create an
     * object.
     */
    OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD = "s3:ObjectCreated:CompleteMultipartUpload",
    /**
     * By using the ObjectRemoved event types, you can enable notification when
     * an object or a batch of objects is removed from a bucket.
     *
     * You can request notification when an object is deleted or a versioned
     * object is permanently deleted by using the s3:ObjectRemoved:Delete event
     * type. Or you can request notification when a delete marker is created for
     * a versioned object by using s3:ObjectRemoved:DeleteMarkerCreated. For
     * information about deleting versioned objects, see Deleting Object
     * Versions. You can also use a wildcard s3:ObjectRemoved:* to request
     * notification anytime an object is deleted.
     *
     * You will not receive event notifications from automatic deletes from
     * lifecycle policies or from failed operations.
     */
    OBJECT_REMOVED = "s3:ObjectRemoved:*",
    /**
     * By using the ObjectRemoved event types, you can enable notification when
     * an object or a batch of objects is removed from a bucket.
     *
     * You can request notification when an object is deleted or a versioned
     * object is permanently deleted by using the s3:ObjectRemoved:Delete event
     * type. Or you can request notification when a delete marker is created for
     * a versioned object by using s3:ObjectRemoved:DeleteMarkerCreated. For
     * information about deleting versioned objects, see Deleting Object
     * Versions. You can also use a wildcard s3:ObjectRemoved:* to request
     * notification anytime an object is deleted.
     *
     * You will not receive event notifications from automatic deletes from
     * lifecycle policies or from failed operations.
     */
    OBJECT_REMOVED_DELETE = "s3:ObjectRemoved:Delete",
    /**
     * By using the ObjectRemoved event types, you can enable notification when
     * an object or a batch of objects is removed from a bucket.
     *
     * You can request notification when an object is deleted or a versioned
     * object is permanently deleted by using the s3:ObjectRemoved:Delete event
     * type. Or you can request notification when a delete marker is created for
     * a versioned object by using s3:ObjectRemoved:DeleteMarkerCreated. For
     * information about deleting versioned objects, see Deleting Object
     * Versions. You can also use a wildcard s3:ObjectRemoved:* to request
     * notification anytime an object is deleted.
     *
     * You will not receive event notifications from automatic deletes from
     * lifecycle policies or from failed operations.
     */
    OBJECT_REMOVED_DELETE_MARKER_CREATED = "s3:ObjectRemoved:DeleteMarkerCreated",
    /**
     * Using restore object event types you can receive notifications for
     * initiation and completion when restoring objects from the S3 Glacier
     * storage class.
     *
     * You use s3:ObjectRestore:Post to request notification of object restoration
     * initiation.
     */
    OBJECT_RESTORE_POST = "s3:ObjectRestore:Post",
    /**
     * Using restore object event types you can receive notifications for
     * initiation and completion when restoring objects from the S3 Glacier
     * storage class.
     *
     * You use s3:ObjectRestore:Completed to request notification of
     * restoration completion.
     */
    OBJECT_RESTORE_COMPLETED = "s3:ObjectRestore:Completed",
    /**
     * Using restore object event types you can receive notifications for
     * initiation and completion when restoring objects from the S3 Glacier
     * storage class.
     *
     * You use s3:ObjectRestore:Delete to request notification of
     * restoration completion.
     */
    OBJECT_RESTORE_DELETE = "s3:ObjectRestore:Delete",
    /**
     * You can use this event type to request Amazon S3 to send a notification
     * message when Amazon S3 detects that an object of the RRS storage class is
     * lost.
     */
    REDUCED_REDUNDANCY_LOST_OBJECT = "s3:ReducedRedundancyLostObject",
    /**
     * You receive this notification event when an object that was eligible for
     * replication using Amazon S3 Replication Time Control failed to replicate.
     */
    REPLICATION_OPERATION_FAILED_REPLICATION = "s3:Replication:OperationFailedReplication",
    /**
     * You receive this notification event when an object that was eligible for
     * replication using Amazon S3 Replication Time Control exceeded the 15-minute
     * threshold for replication.
     */
    REPLICATION_OPERATION_MISSED_THRESHOLD = "s3:Replication:OperationMissedThreshold",
    /**
     * You receive this notification event for an object that was eligible for
     * replication using the Amazon S3 Replication Time Control feature replicated
     * after the 15-minute threshold.
     */
    REPLICATION_OPERATION_REPLICATED_AFTER_THRESHOLD = "s3:Replication:OperationReplicatedAfterThreshold",
    /**
     * You receive this notification event for an object that was eligible for
     * replication using Amazon S3 Replication Time Control but is no longer tracked
     * by replication metrics.
     */
    REPLICATION_OPERATION_NOT_TRACKED = "s3:Replication:OperationNotTracked",
    /**
     * By using the LifecycleExpiration event types, you can receive a notification
     * when Amazon S3 deletes an object based on your S3 Lifecycle configuration.
     */
    LIFECYCLE_EXPIRATION = "s3:LifecycleExpiration:*",
    /**
     * The s3:LifecycleExpiration:Delete event type notifies you when an object
     * in an unversioned bucket is deleted.
     * It also notifies you when an object version is permanently deleted by an
     * S3 Lifecycle configuration.
     */
    LIFECYCLE_EXPIRATION_DELETE = "s3:LifecycleExpiration:Delete",
    /**
     * The s3:LifecycleExpiration:DeleteMarkerCreated event type notifies you
     * when S3 Lifecycle creates a delete marker when a current version of an
     * object in versioned bucket is deleted.
     */
    LIFECYCLE_EXPIRATION_DELETE_MARKER_CREATED = "s3:LifecycleExpiration:DeleteMarkerCreated",
    /**
     * You receive this notification event when an object is transitioned to
     * another Amazon S3 storage class by an S3 Lifecycle configuration.
     */
    LIFECYCLE_TRANSITION = "s3:LifecycleTransition",
    /**
     * You receive this notification event when an object within the
     * S3 Intelligent-Tiering storage class moved to the Archive Access tier or
     * Deep Archive Access tier.
     */
    INTELLIGENT_TIERING = "s3:IntelligentTiering",
    /**
     * By using the ObjectTagging event types, you can enable notification when
     * an object tag is added or deleted from an object.
     */
    OBJECT_TAGGING = "s3:ObjectTagging:*",
    /**
     * The s3:ObjectTagging:Put event type notifies you when a tag is PUT on an
     * object or an existing tag is updated.
  
     */
    OBJECT_TAGGING_PUT = "s3:ObjectTagging:Put",
    /**
     * The s3:ObjectTagging:Delete event type notifies you when a tag is removed
     * from an object.
     */
    OBJECT_TAGGING_DELETE = "s3:ObjectTagging:Delete",
    /**
     * You receive this notification event when an ACL is PUT on an object or when
     * an existing ACL is changed.
     * An event is not generated when a request results in no change to an
     * object’s ACL.
     */
    OBJECT_ACL_PUT = "s3:ObjectAcl:Put"
}
export interface NotificationKeyFilter {
    /**
     * Unique identifier for each of the notification configurations.
     */
    readonly id?: string;
    /**
     * S3 keys must have the specified prefix.
     */
    readonly prefix?: string;
    /**
     * S3 keys must have the specified suffix.
     */
    readonly suffix?: string;
}

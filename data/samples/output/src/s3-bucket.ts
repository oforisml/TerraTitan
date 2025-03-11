import { Construct } from "constructs";
import { S3Bucket as AwsS3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioningA as AwsS3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketPublicAccessBlock as AwsS3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketServerSideEncryptionConfiguration as AwsS3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";

export interface S3BucketProps {
  bucketName: string;
  versioned?: boolean;
  encryption?: "AES256" | "aws:kms";
  publicReadAccess?: boolean;
}

export class S3Bucket extends Construct {
  public readonly bucket: AwsS3Bucket;

  constructor(scope: Construct, id: string, props: S3BucketProps) {
    super(scope, id);

    this.bucket = new AwsS3Bucket(this, "Bucket", {
      bucket: props.bucketName,
    });

    new AwsS3BucketVersioning(this, "BucketVersioning", {
      bucketId: this.bucket.id,
      versioningConfiguration: {
        status: props.versioned ? "Enabled" : "Disabled",
      },
    });

    if (props.encryption) {
      new AwsS3BucketServerSideEncryptionConfiguration(
        this,
        "BucketEncryption",
        {
          bucketId: this.bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: props.encryption,
              },
            },
          ],
        }
      );
    }

    new AwsS3BucketPublicAccessBlock(this, "BucketPublicAccessBlock", {
      bucket: this.bucket.id,
      blockPublicAcls: !props.publicReadAccess,
      blockPublicPolicy: !props.publicReadAccess,
      ignorePublicAcls: !props.publicReadAccess,
      restrictPublicBuckets: !props.publicReadAccess,
    });
  }
}

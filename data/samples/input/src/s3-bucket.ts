import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface S3BucketProps {
  bucketName: string;
  versioned?: boolean;
  encryption?: s3.BucketEncryption;
  publicReadAccess?: boolean;
}

export class S3Bucket extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3BucketProps) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, "Bucket", {
      bucketName: props.bucketName,
      versioned: props.versioned ?? false,
      encryption: props.encryption ?? s3.BucketEncryption.S3_MANAGED,
      publicReadAccess: props.publicReadAccess ?? false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
  }
}

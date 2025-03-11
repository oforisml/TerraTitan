import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as s3 from "aws-cdk-lib/aws-s3";
import { S3Bucket } from "../src/s3-bucket";

describe("S3Bucket", () => {
  test("creates bucket with defaults", () => {
    const app = new App();
    const stack = new Stack(app, "TestStack");

    new S3Bucket(stack, "TestBucket", {
      bucketName: "test-bucket",
    });

    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: "test-bucket",
      VersioningConfiguration: {
        Status: "Disabled",
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });
});

import { Testing } from "cdktf";
import { S3Bucket } from "../src/s3-bucket";

describe("S3Bucket", () => {
  test("creates bucket with defaults", () => {
    const app = Testing.app();
    const stack = Testing.fullSynth(app);

    new S3Bucket(stack, "TestBucket", {
      bucketName: "test-bucket",
    });

    expect(
      Testing.toHaveResourceWithProperties(stack, "aws_s3_bucket", {
        bucket: "test-bucket",
      })
    ).toBeTruthy();

    expect(
      Testing.toHaveResourceWithProperties(stack, "aws_s3_bucket_versioning", {
        versioning_configuration: {
          status: "Disabled",
        },
      })
    ).toBeTruthy();

    expect(
      Testing.toHaveResourceWithProperties(
        stack,
        "aws_s3_bucket_public_access_block",
        {
          block_public_acls: true,
          block_public_policy: true,
          ignore_public_acls: true,
          restrict_public_buckets: true,
        }
      )
    ).toBeTruthy();
  });
});

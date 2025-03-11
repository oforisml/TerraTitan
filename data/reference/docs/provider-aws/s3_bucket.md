# Resource: aws_s3_bucket

Provides an S3 bucket resource.

## Example Usage

```typescript
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';

new S3Bucket(this, 'example', {
  bucket: 'my-test-bucket',
  tags: {
    Name: 'My bucket',
    Environment: 'Dev',
  },
});
```

## Argument Reference

The following arguments are supported:

* `bucket` - (Optional) The name of the bucket. If omitted, CDKTF will assign a random, unique name.
* `bucketPrefix` - (Optional) Creates a unique bucket name beginning with the specified prefix.
* `acl` - (Optional) The canned ACL to apply. Valid values are `private`, `public-read`, etc.
* `tags` - (Optional) A mapping of tags to assign to the bucket.

## Attributes Reference

In addition to all arguments above, the following attributes are exported:

* `id` - The name of the bucket.
* `arn` - The ARN of the bucket.
* `domainName` - The bucket domain name.
* `regionalDomainName` - The regional domain name of the bucket.

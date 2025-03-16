# Conversion Samples

This directory contains curated samples of AWS CDK constructs and their Terraform CDK equivalents.

Each sample should include:
1. Original AWS CDK construct source code
2. Original AWS CDK construct tests
3. Converted Terraform CDK construct source code
4. Converted Terraform CDK construct tests

## Structure

- `input/src/` - Original AWS CDK source files
- `input/test/` - Original AWS CDK test files
- `input/integ/` - Original AWS CDK integration test files
- `output/src/` - Converted Terraform CDK source files
- `output/test/` - Converted Terraform CDK test files
- `output/integ/` - Converted Terraform CDK integration test files

## Adding Samples

Each sample should be placed in its own subdirectory named after the construct.


## Sample Index

> NOTE: currently TerraConstructs merges AWS EventBridge, AWS SQS, AWS Kinesis, AWS SNS, ... into `notify`.

- aws-events (no integration tests)
- aws-kinesis (includes integration tests)

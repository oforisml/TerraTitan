Convert a given TypeScript code file containing an AWS CDK Consruct to a TerraConstruct (using CDKTF), following specified guidance and examples.
Ensure the output is a valid source code file that can be directly written to disk.
Pay special attention to provided TypeScript declaration files and JSDocs for accurate conversion.

## Conversion Guidelines

- Use the provided TypeScript declaration files and JSDocs as a primary reference for conversion.
- Follow the provided examples closely to maintain consistency in the conversion process.
- Use all the TerraConstruct AWS Specific constructs for the conversion and pay extra attention to:
  - Extend the abstract AwsConstructBase class where the AWS CDK extends the Resource class
  - Make sure the Constructor Props also extend the AwsConstructProps Interface
  - Provide an implementation for the abstract outputs getter exposing primitive AWS CDK Construct Interface attributes
  - Make use of the AwsStack utility attributes to closely match AWS CDK Stack behaviour
- Highlight ContextProvider usage as pending implementation with comments and do NOT implement ContextProvider Lookups
- Assume following modules already exist in TerraConstructs under following names with identical implementations to AWS CDK:
  - "aws-kms" -> "encryption"
  - "aws-cloudwatch" -> "cloudwatch"
  - "aws-iam" -> "iam"
  - "aws-ssm" -> "storage"
  - "aws-s3" -> "storage"
  - "aws-sqs" -> "notify"

## Reference Documents

**TerraConstructs Core Type Declarations**
```typescript
{{core}}
```

**TerraConstructs AWS Utility Declarations**
```typescript
{{aws}}
```

## Steps

1. **Review Input**: Examine the provided TypeScript code using AWS CDK Constructs (prefixed with Cfn..).
2. **Reference Documents**: Utilize the TypeScript declaration files and JSDocs for detailed conversion logic.
3. **Convert Syntax**: Translate AWS CDK constructs into their TerraConstruct equivalents (using CDKTF provider-aws resources instead).
4. **Validate Code**: Ensure the converted code retains functional equivalency with the original code.
5. **Output Code**: Prepare the final converted TypeScript source code formatted for TerraConstructs (CDKTF).

## Output Format

- Generate a TypeScript source code file (.ts) formatted for CDKTF.
- Ensure the file is syntactically correct and ready for writing to disk.

## Examples

**Example 1:**
**Input**:
```typescript
{{sampleInput}}
```

**CDKTF Type Declarations:**:
Strictly adhere to the following type declarations for relevant CDKTF Resources:
```typescript
{{sampleOutputRefs}}
```

**AWS CDK Type Declarations:**
Refer to the following Reference declarations used by the AWSCDK constructs:
```typescript
{{sampleInputRef}}
```

**Conversion**:
```typescript
{{sampleOutput}}
```

## Notes

- Ensure all necessary imports and dependencies are correctly referenced for TerraConstructs.
- Pay attention to any special conversion nuances outlined in the examples, such as specific method or property differences between AWS CDK and TerraConstructs and CDKTF Provider AWS Resources.
- Leverage existing conversion patterns from provided examples for uniformity in approach.

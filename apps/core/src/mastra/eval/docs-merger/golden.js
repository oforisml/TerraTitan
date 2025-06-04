export default [
  {
    interfaceName: "LambdaConfig",
    property: {
      name: "runtime",
      existingDoc: "",
      type: "string"
    },
    markdownContent: "This config sets up an AWS Lambda function. Use 'nodejs18.x' or 'python3.10' as runtime.",
    expected: "The runtime environment for the Lambda function, such as 'nodejs18.x' or 'python3.10'.",
    notes: "Ensure it includes valid example values."
  },
  {
    interfaceName: "LambdaConfig",
    property: {
      name: "timeout",
      existingDoc: "/** Duration in seconds */",
      type: "number"
    },
    markdownContent: "Specifies how long the Lambda function can run before timing out.",
    expected: "Maximum execution time (in seconds) before the Lambda times out.",
    notes: "Should retain 'seconds' context and improve clarity."
  },
  {
    interfaceName: "LambdaConfig",
    property: {
      name: "memorySize",
      existingDoc: "",
      type: "number"
    },
    markdownContent: "The amount of memory (in MB) to allocate to the Lambda function.",
    expected: "Memory allocated to the Lambda function in megabytes (MB).",
    notes: "Unit should be clearly stated."
  },
  {
    interfaceName: "S3BucketConfig",
    property: {
      name: "versioning",
      existingDoc: "",
      type: "boolean"
    },
    markdownContent: "You can enable versioning to keep multiple versions of an object in the bucket.",
    expected: "Whether to enable versioning to preserve multiple versions of objects in the S3 bucket.",
    notes: "Look for 'whether' phrasing for booleans."
  },
  {
    interfaceName: "S3BucketConfig",
    property: {
      name: "encryption",
      existingDoc: "",
      type: "string"
    },
    markdownContent: "Encryption can be set to 'AES256' or 'aws:kms' to protect your data at rest.",
    expected: "The encryption method for the S3 bucket, such as 'AES256' or 'aws:kms'.",
    notes: "Agent should not invent other encryption types."
  },
  {
    interfaceName: "IAMRoleConfig",
    property: {
      name: "policyDocument",
      existingDoc: "",
      type: "object"
    },
    markdownContent: "The IAM policy document defines permissions for this role. It must follow the AWS IAM policy schema.",
    expected: "IAM policy document defining the role's permissions, following AWS policy schema.",
    notes: "Test how well it handles object types and mentions schema."
  },
  {
    interfaceName: "CloudWatchAlarmConfig",
    property: {
      name: "threshold",
      existingDoc: "",
      type: "number"
    },
    markdownContent: "The numeric threshold at which the alarm is triggered.",
    expected: "The value at which the CloudWatch alarm will trigger.",
    notes: ""
  },
  {
    interfaceName: "CloudWatchAlarmConfig",
    property: {
      name: "comparisonOperator",
      existingDoc: "",
      type: "string"
    },
    markdownContent: "Set to 'GreaterThanThreshold', 'LessThanThreshold', etc.",
    expected: "Condition used to compare metric values, e.g., 'GreaterThanThreshold'.",
    notes: "Checks if the agent recognizes enum-style options."
  },
  {
    interfaceName: "ApiGatewayConfig",
    property: {
      name: "loggingLevel",
      existingDoc: "",
      type: "string"
    },
    markdownContent: "Logging level can be OFF, ERROR, or INFO.",
    expected: "The logging level for API Gateway. Valid values: OFF, ERROR, INFO.",
    notes: "Agent should echo allowed values and use declarative tone."
  },
  {
    interfaceName: "VpcConfig",
    property: {
      name: "cidrBlock",
      existingDoc: "",
      type: "string"
    },
    markdownContent: "Defines the IP address range for the VPC in CIDR notation, e.g., 10.0.0.0/16.",
    expected: "CIDR block that defines the IP address range for the VPC (e.g., 10.0.0.0/16).",
    notes: ""
  }
];
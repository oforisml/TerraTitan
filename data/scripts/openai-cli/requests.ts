import fs from "fs";
import path from "path";
import ts from "typescript";
import { type ConversionRequestsBase } from "./util/types";

/**
 * Unit Test Conversion Requests
 */
export const unitRequests: Record<string, ConversionRequestsBase> = {
  "aws-events/connection": {
    responseFile: `./responses/events-connection-test`,
    inputFile: "samples/aws-events/connection/input/test/connection.test.ts",
    inputRefFiles: [
      "/samples/aws-events/connection/input/declarations/connection.d.ts",
    ],
    outputRefFiles: [
      // Unit Tests use Terraform HCL Markdown docs as reference for testing attributes
      "reference/docs/provider-aws/r/cloudwatch_event_connection.html.markdown",
    ],
    // For token estimates...
    expectedFile:
      "samples/aws-events/connection/output/test/connection.test.ts",
  },
  "aws-sns/topic": {
    responseFile: `./responses/sns-topic-test`,
    inputFile: "samples/aws-sns/topic/input/test/sns.test.ts",
    inputRefFiles: [
      "samples/aws-sns/topic/input/declarations/topic.d.ts",
      "samples/aws-sns/topic/input/declarations/topic-base.d.ts",
      "samples/aws-sns/topic/input/declarations/policy.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/sns_topic.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_policy.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_data_protection_policy.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/topic/output/test/sns.test.ts",
  },
  "aws-sns/subscription": {
    responseFile: `./responses/sns-subscription-test`,
    inputFile: "samples/aws-sns/subscription/input/test/subscription.test.ts",
    inputRefFiles: [
      "samples/aws-sns/subscription/input/declarations/policy.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscriber.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription-filter.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/sns_topic_subscription.html.markdown",
      "reference/docs/provider-aws/r/sns_topic_policy.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
  "aws-iam/user": {
    responseFile: `./responses/iam-user-test`,
    inputFile: "samples/aws-iam/user/input/test/user.test.ts",
    inputRefFiles: ["/samples/aws-iam/user/input/declarations/user.d.ts"],
    outputRefFiles: [
      "reference/docs/provider-aws/r/iam_user.html.markdown",
      "reference/docs/provider-aws/r/iam_user_policy.html.markdown",
      "reference/docs/provider-aws/r/iam_user_policy_attachment.html.markdown",
      "reference/docs/provider-aws/r/iam_user_ssh_key.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
  "aws-iam/group": {
    responseFile: `./responses/iam-group-test`,
    inputFile: "samples/aws-iam/group/input/test/group.test.ts",
    inputRefFiles: [
      "/samples/aws-iam/group/input/declarations/group.d.ts",
      "/samples/aws-iam/group/input/declarations/user.d.ts",
      "/samples/aws-iam/group/input/declarations/managed-policy.d.ts",
    ],
    outputRefFiles: [
      "reference/docs/provider-aws/r/iam_user.html.markdown",
      "reference/docs/provider-aws/r/iam_group_membership.html.markdown",
      // "reference/docs/provider-aws/r/iam_group_policies_exclusive.html.markdown",
      "reference/docs/provider-aws/r/iam_group_policy_attachment.html.markdown",
      // "reference/docs/provider-aws/r/iam_group_policy_attachments_exclusive.html.markdown",
      "reference/docs/provider-aws/r/iam_group_policy.html.markdown",
      "reference/docs/provider-aws/r/iam_group.html.markdown",
    ],
    // For token estimates...
    // expectedFile: "samples/aws-sns/subscription/output/test/subscription.test.ts",
  },
};

export const sourceRequests: Record<string, ConversionRequestsBase> = {
  "aws-events/connection": {
    responseFile: `./responses/connection-response`,
    inputFile: `samples/aws-events/connection/input/src/connection.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-events/lib/events.generated.d.ts`,
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      `reference/merged/provider-aws/cloudwatch-event-connection/index.d.ts`,
    ],
    // For token estimates...
    expectedFile: `samples/aws-events/connection/output/src/connection.ts`,
  },
  "aws-iam/user": {
    responseFile: `./responses/iam-user-src`,
    inputFile: `samples/aws-iam/user/input/src/user.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-iam/lib/iam.generated.d.ts`,
    ],
    // NOTE: this was missing iamUserLoginProfile
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/iam-user/index.d.ts",
      "reference/merged/provider-aws/iam-user-policy/index.d.ts",
      "reference/merged/provider-aws/iam-user-policy-attachment/index.d.ts",
      "reference/merged/provider-aws/iam-user-ssh-key/index.d.ts",
      // "reference/merged/provider-aws/iam-user-login-profile/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
  "aws-iam/group": {
    responseFile: `./responses/iam-group-src`,
    inputFile: `samples/aws-iam/group/input/src/group.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-iam/lib/iam.generated.d.ts`,
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/iam-group/index.d.ts",
      "reference/merged/provider-aws/iam-user/index.d.ts",
      "reference/merged/provider-aws/iam-group-membership/index.d.ts",
      "reference/merged/provider-aws/iam-group-policy/index.d.ts",
      "reference/merged/provider-aws/iam-group-policy-attachment/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
  "aws-sns/topic": {
    responseFile: `./responses/sns-topic-src`,
    inputFile: `samples/aws-sns/topic/input/src/topic.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      `reference/declarations/aws-cdk-lib/aws-sns/lib/sns.generated.d.ts`,
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/sns-topic/index.d.ts",
      "reference/merged/provider-aws/sns-topic-data-protection-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-subscription/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
  "aws-sns/topic-base": {
    responseFile: `./responses/sns-topic-base-src`,
    inputFile: `samples/aws-sns/topic/input/src/topic-base.ts`,
    inputRefFiles: [
      // NOTE: this filters on Cfn imports from /.*\.generated\.ts found in inputFile...
      // `reference/declarations/aws-cdk-lib/aws-sns/lib/sns.generated.d.ts`,
      "samples/aws-sns/topic/input/declarations/topic.d.ts",
      "samples/aws-sns/topic/input/declarations/topic-base.d.ts",
      "samples/aws-sns/subscription/input/declarations/policy.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscriber.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription-filter.d.ts",
      "samples/aws-sns/subscription/input/declarations/subscription.d.ts",
    ],
    outputRefFiles: [
      // Note: created by running bun scripts/merge-docs/index.ts!
      "reference/merged/provider-aws/sns-topic/index.d.ts",
      "reference/merged/provider-aws/sns-topic-data-protection-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-policy/index.d.ts",
      "reference/merged/provider-aws/sns-topic-subscription/index.d.ts",
    ],
    // For token estimates...
    // expectedFile: `samples/aws-iam/user/output/src/user.ts`,
  },
};

interface GenerateSampleOptions {
  sourceFileUrl: string; // GitHub URL to CDK source file
  testFileUrl: string; // GitHub URL to CDK test file
  basePath?: string; // Path to data directory
}

interface ScanOptions {
  basePath?: string; // Path to data directory
  awsService: string;
  resource: string;
  referenceResources?: string[];
}

/**
 * Scans a sample directory to identify required input and output reference files
 * for both unit test and source code conversions
 */
export function scanSampleDirectory(options: ScanOptions): {
  unitRequest: ConversionRequestsBase;
  sourceRequest: ConversionRequestsBase;
} {
  const {
    basePath = path.join(__dirname, "../.."),
    awsService,
    resource,
    referenceResources = [],
  } = options;
  const sampleDir = path.join(
    basePath,
    "samples",
    `aws-${awsService}`,
    resource
  );

  // Results object
  const result = {
    unitRequest: {
      responseFile: `./responses/${awsService}-${resource}-test`,
      inputFile: "",
      inputRefFiles: [],
      outputRefFiles: [],
    } as ConversionRequestsBase,
    sourceRequest: {
      responseFile: `./responses/${awsService}-${resource}-src`,
      inputFile: "",
      inputRefFiles: [],
      outputRefFiles: [],
    } as ConversionRequestsBase,
  };

  // Find test files
  const testDir = path.join(sampleDir, "input", "test");
  if (fs.existsSync(testDir)) {
    const testFiles = fs
      .readdirSync(testDir)
      .filter((file) => file.endsWith(".test.ts"));
    if (testFiles.length > 0) {
      result.unitRequest.inputFile = `samples/aws-${awsService}/${resource}/input/test/${testFiles[0]}`;
    }
  }

  // Find source files
  const srcDir = path.join(sampleDir, "input", "src");
  if (fs.existsSync(srcDir)) {
    const srcFiles = fs
      .readdirSync(srcDir)
      .filter((file) => file.endsWith(".ts"));
    if (srcFiles.length > 0) {
      result.sourceRequest.inputFile = `samples/aws-${awsService}/${resource}/input/src/${srcFiles[0]}`;
    }
  }

  // Find declaration files
  const declDir = path.join(sampleDir, "input", "declarations");
  if (fs.existsSync(declDir)) {
    const declFiles = fs
      .readdirSync(declDir)
      .filter((file) => file.endsWith(".d.ts"));
    result.unitRequest.inputRefFiles = declFiles.map(
      (file) =>
        `samples/aws-${awsService}/${resource}/input/declarations/${file}`
    );

    // Add some of these to source requests as well if they're relevant
    result.sourceRequest.inputRefFiles = declFiles.map(
      (file) =>
        `samples/aws-${awsService}/${resource}/input/declarations/${file}`
    );
  }

  // Add CDK generated types reference for source requests
  const cdkService = getCdkServiceName(awsService);
  if (cdkService) {
    result.sourceRequest.inputRefFiles.unshift(
      `reference/declarations/aws-cdk-lib/aws-${cdkService}/lib/${cdkService}.generated.d.ts`
    );
  }

  // Find Terraform docs for unit tests
  const resourceSnakeCase = snakeCase(resource);
  const resourceKebabCase = kebabCase(resource);

  // Create doc patterns for main resource and any reference resources
  const docPatterns = [
    `${awsService}_${resourceSnakeCase}`,
    ...referenceResources.map((r) => `${awsService}_${snakeCase(r)}`),
  ];

  // Find terraform provider docs
  const terraformDocsPath = path.join(
    basePath,
    "reference",
    "docs",
    "provider-aws",
    "r"
  );
  if (fs.existsSync(terraformDocsPath)) {
    const docFiles = fs.readdirSync(terraformDocsPath).filter((file) => {
      if (!file.endsWith(".html.markdown")) return false;
      // Check if the file matches any of our patterns
      return docPatterns.some((pattern) => file.includes(pattern));
    });

    result.unitRequest.outputRefFiles = docFiles.map(
      (file) => `reference/docs/provider-aws/r/${file}`
    );
  }

  // Find merged terraform docs for source requests
  const mergedDocsPath = path.join(
    basePath,
    "reference",
    "merged",
    "provider-aws"
  );
  if (fs.existsSync(mergedDocsPath)) {
    const mergedPatterns = [
      resourceKebabCase,
      ...referenceResources.map((r) => kebabCase(r)),
    ];

    const mergedDirs = fs.readdirSync(mergedDocsPath).filter((dir) => {
      // Check if directory matches any pattern or contains the service name
      return (
        dir.includes(awsService) ||
        mergedPatterns.some((pattern) => dir.includes(pattern))
      );
    });

    result.sourceRequest.outputRefFiles = mergedDirs.map(
      (dir) => `reference/merged/provider-aws/${dir}/index.d.ts`
    );
  }

  // Add expected file paths if available
  const expectedTestFile = path.join(
    sampleDir,
    "output",
    "test",
    `${resource}.test.ts`
  );
  if (fs.existsSync(expectedTestFile)) {
    result.unitRequest.expectedFile = `samples/aws-${awsService}/${resource}/output/test/${resource}.test.ts`;
  }

  const expectedSrcFile = path.join(
    sampleDir,
    "output",
    "src",
    `${resource}.ts`
  );
  if (fs.existsSync(expectedSrcFile)) {
    result.sourceRequest.expectedFile = `samples/aws-${awsService}/${resource}/output/src/${resource}.ts`;
  }

  return result;
}

// Helper functions
function kebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

function snakeCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}

function getCdkServiceName(awsService: string): string {
  // Map AWS service names to CDK service names
  const serviceMap: Record<string, string> = {
    events: "events",
    iam: "iam",
    sns: "sns",
    // Add more mappings as needed
  };
  return serviceMap[awsService] || awsService;
}

/**
 * Extracts service and resource name from a CDK GitHub URL
 */
export function extractInfoFromUrl(url: string): {
  service: string;
  resource: string;
  rawUrl: string;
} {
  // Example: https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-sqs/lib/queue.ts
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split("/");
  const awsSegments = pathSegments.filter(
    (segment) => segment.startsWith("aws-") && segment !== "aws-cdk-lib"
  );

  // Find AWS service segment (must be after aws-cdk-lib in the path)
  let service = "";
  const cdkLibIndex = pathSegments.indexOf("aws-cdk-lib");

  if (cdkLibIndex >= 0 && cdkLibIndex + 1 < pathSegments.length) {
    const nextSegment = pathSegments[cdkLibIndex + 1];
    if (nextSegment && nextSegment.startsWith("aws-")) {
      service = nextSegment.replace("aws-", "");
    }
  }

  // Get resource name from filename (e.g., "queue" from "queue.ts")
  const fileName = pathSegments[pathSegments.length - 1]!;
  const resource = fileName.replace(".ts", "");

  // Convert GitHub URL to raw content URL
  const rawUrl = url
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/blob/", "/");

  return { service, resource, rawUrl };
}

/**
 * Generates a sample directory structure from AWS CDK GitHub source and test files
 */
export async function generateSampleFromCdk(
  options: GenerateSampleOptions
): Promise<{ service: string; resource: string }> {
  const {
    sourceFileUrl,
    testFileUrl,
    basePath = path.join(__dirname, "../.."),
  } = options;

  // Extract service and resource information
  const sourceInfo = extractInfoFromUrl(sourceFileUrl);
  const testInfo = extractInfoFromUrl(testFileUrl);

  console.log(
    `Generating sample for AWS ${sourceInfo.service} ${sourceInfo.resource}`
  );

  // Create sample directory structure
  const sampleDir = path.join(
    basePath,
    "samples",
    `aws-${sourceInfo.service}`,
    sourceInfo.resource
  );
  const inputDir = path.join(sampleDir, "input");
  const srcDir = path.join(inputDir, "src");
  const testDir = path.join(inputDir, "test");
  const declDir = path.join(inputDir, "declarations");

  // Create directories
  [sampleDir, inputDir, srcDir, testDir, declDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Download source and test files using Bun's fetch
  const sourceContent = await fetch(sourceInfo.rawUrl).then((res) =>
    res.text()
  );
  const testContent = await fetch(testInfo.rawUrl).then((res) => res.text());

  // Write files
  const sourceFilePath = path.join(srcDir, `${sourceInfo.resource}.ts`);
  const testFilePath = path.join(testDir, `${sourceInfo.resource}.test.ts`);

  fs.writeFileSync(sourceFilePath, sourceContent);
  fs.writeFileSync(testFilePath, testContent);

  console.log(`Downloaded source file to: ${sourceFilePath}`);
  console.log(`Downloaded test file to: ${testFilePath}`);

  // Generate declaration file using TypeScript compiler API
  const tsconfigPath = path.join(sampleDir, "tsconfig.json");
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2018,
    module: ts.ModuleKind.CommonJS,
    declaration: true,
    declarationDir: declDir,
    outDir: path.join(sampleDir, "dist"),
    rootDir: srcDir,
    strict: true,
    esModuleInterop: true,
  };

  // Write tsconfig for reference
  fs.writeFileSync(
    tsconfigPath,
    JSON.stringify(
      {
        compilerOptions,
        include: [`src/${sourceInfo.resource}.ts`],
      },
      null,
      2
    )
  );

  try {
    console.log("Generating declaration files...");

    // Create program
    const sourceFiles = [sourceFilePath];
    const host = ts.createCompilerHost(compilerOptions);
    const program = ts.createProgram(sourceFiles, compilerOptions, host);

    // Emit declaration files
    const emitResult = program.emit();

    // Check for errors
    const allDiagnostics = ts
      .getPreEmitDiagnostics(program)
      .concat(emitResult.diagnostics);

    if (allDiagnostics.length > 0) {
      console.error("TypeScript compilation errors:");
      allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(
            diagnostic.file,
            diagnostic.start!
          );
          const message = ts.flattenDiagnosticMessageText(
            diagnostic.messageText,
            "\n"
          );
          console.error(
            `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
          );
        } else {
          console.error(
            ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
          );
        }
      });
    } else {
      console.log(`Generated declaration files in: ${declDir}`);
    }
  } catch (error) {
    console.error("Error generating declaration files:", error);
  }

  // Check for reference data
  const terraformDocsPath = path.join(
    basePath,
    "reference",
    "docs",
    "provider-aws",
    "r"
  );

  const resourceSnakeCase = snakeCase(sourceInfo.resource);
  const docPattern = `${sourceInfo.service}_${resourceSnakeCase}`;

  const missingReferences = [];

  // Check Terraform docs
  if (!fs.existsSync(terraformDocsPath)) {
    missingReferences.push("Terraform documentation directory");
  } else {
    const docs = fs
      .readdirSync(terraformDocsPath)
      .filter((file) => file.includes(docPattern));

    if (docs.length === 0) {
      missingReferences.push(`Terraform documentation for ${docPattern}`);
    }
  }

  // Check CDK declarations
  const cdkDeclPath = path.join(
    basePath,
    "reference",
    "declarations",
    "aws-cdk-lib",
    `aws-${sourceInfo.service}`,
    "lib",
    `${sourceInfo.service}.generated.d.ts`
  );

  if (!fs.existsSync(cdkDeclPath)) {
    missingReferences.push(
      `CDK generated declarations for aws-${sourceInfo.service}`
    );
  }

  // Provide warnings for missing reference data
  if (missingReferences.length > 0) {
    console.warn("\nWARNING: Missing reference data:");
    missingReferences.forEach((ref) => console.warn(`- ${ref}`));
    console.warn("\nYou may need to:");
    console.warn("1. Run scripts to download Terraform documentation");
    console.warn("2. Run scripts to generate CDK declarations");
  }

  console.log("\nSample generation complete!");
  return { service: sourceInfo.service, resource: sourceInfo.resource };
}

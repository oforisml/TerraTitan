import { expect, test, describe, mock, beforeEach, afterEach } from "bun:test";
import { scanSampleDirectory, extractInfoFromUrl } from "./requests";
import { type PathLike } from "fs";
import fs from "fs";
import path from "path";

// Mock fs and path modules
mock.module("fs", () => ({
  existsSync: mock(() => true),
  readdirSync: mock(() => []),
}));

mock.module("path", () => ({
  join: mock((...args: string[]) => args.join("/")),
}));

describe("scanSampleDirectory", () => {
  beforeEach(() => {
    // Mock path.join to concatenate paths with forward slashes
    path.join = mock((...args: string[]) => args.join("/"));

    // Mock fs.existsSync to return true by default
    fs.existsSync = mock(() => true);

    // Mock fs.readdirSync for different directory contents
    fs.readdirSync = mock((dirPath: PathLike) => {
      // Convert PathLike to string for comparison
      const pathStr = dirPath.toString();

      if (pathStr.includes("/test")) {
        return ["lambda.test.ts"];
      } else if (pathStr.includes("/src")) {
        return ["lambda.ts"];
      } else if (pathStr.includes("/declarations")) {
        return ["lambda.d.ts", "policy.d.ts"];
      } else if (pathStr.includes("/provider-aws/r")) {
        return [
          "lambda_function.html.markdown",
          "lambda_permission.html.markdown",
          "lambda_foo.html.markdown",
        ];
      } else if (pathStr.includes("/merged/provider-aws")) {
        return ["lambda-function", "lambda-permission"];
      }
      return [];
    }) as any; // Type assertion to help with complex fs.readdirSync overloads
  });

  afterEach(() => {
    mock.restore();
  });

  test("should correctly scan a complete sample directory", () => {
    const options = {
      basePath: "/fake/path",
      awsService: "lambda",
      resource: "function",
      referenceResources: ["permission"],
    };

    const result = scanSampleDirectory(options);

    // Verify response file names
    expect(result.unitRequest.responseFile).toBe(
      "./responses/lambda-function-test"
    );
    expect(result.sourceRequest.responseFile).toBe(
      "./responses/lambda-function-src"
    );

    // Verify input files
    expect(result.unitRequest.inputFile).toBe(
      "samples/aws-lambda/function/input/test/lambda.test.ts"
    );
    expect(result.sourceRequest.inputFile).toBe(
      "samples/aws-lambda/function/input/src/lambda.ts"
    );

    // Verify input reference files
    expect(result.unitRequest.inputRefFiles).toEqual([
      "samples/aws-lambda/function/input/declarations/lambda.d.ts",
      "samples/aws-lambda/function/input/declarations/policy.d.ts",
    ]);

    // Verify CDK reference is added first in source inputRefFiles
    expect(result.sourceRequest.inputRefFiles[0]).toBe(
      "reference/declarations/aws-cdk-lib/aws-lambda/lib/lambda.generated.d.ts"
    );

    // Verify output reference files
    expect(result.unitRequest.outputRefFiles).toEqual([
      "reference/docs/provider-aws/r/lambda_function.html.markdown",
      "reference/docs/provider-aws/r/lambda_permission.html.markdown",
    ]);

    expect(result.sourceRequest.outputRefFiles).toEqual([
      "reference/merged/provider-aws/lambda-function/index.d.ts",
      "reference/merged/provider-aws/lambda-permission/index.d.ts",
    ]);
  });

  test("should handle missing directories", () => {
    // Mock certain directories as missing
    fs.existsSync = mock((path: PathLike) => {
      const pathStr = path.toString();
      if (pathStr.includes("/test") || pathStr.includes("/declarations")) {
        return false;
      }
      return true;
    }) as any;

    // Need to also mock readdirSync for this specific test
    fs.readdirSync = mock((dirPath: PathLike) => {
      const pathStr = dirPath.toString();
      if (pathStr.includes("/src")) {
        return ["lambda.ts"];
      }
      return [];
    }) as any;

    const options = {
      basePath: "/fake/path",
      awsService: "lambda",
      resource: "function",
    };

    const result = scanSampleDirectory(options);

    // Verify missing directories result in empty values
    expect(result.unitRequest.inputFile).toBe("");
    expect(result.unitRequest.inputRefFiles).toEqual([]);
    expect(result.sourceRequest.inputFile).toBe(
      "samples/aws-lambda/function/input/src/lambda.ts"
    );
  });

  test("should handle expected output files", () => {
    // Mock expected file existence
    fs.existsSync = mock((path: PathLike) => {
      const pathStr = path.toString();
      if (
        pathStr.includes("/output/test/function.test.ts") ||
        pathStr.includes("/output/src/function.ts")
      ) {
        return true;
      }
      return true; // Other paths exist by default
    }) as any;

    const options = {
      basePath: "/test/path",
      awsService: "lambda",
      resource: "function",
    };

    const result = scanSampleDirectory(options);

    // Verify expected files are set correctly
    expect(result.unitRequest.expectedFile).toBe(
      "samples/aws-lambda/function/output/test/function.test.ts"
    );
    expect(result.sourceRequest.expectedFile).toBe(
      "samples/aws-lambda/function/output/src/function.ts"
    );
  });

  test("should handle non-existent CDK service mapping", () => {
    const options = {
      basePath: "/test/path",
      awsService: "unknown-service", // Not in the service map
      resource: "function",
    };

    const result = scanSampleDirectory(options);

    // Verify it falls back to the provided service name
    expect(result.sourceRequest.inputRefFiles[0]).toBe(
      "reference/declarations/aws-cdk-lib/aws-unknown-service/lib/unknown-service.generated.d.ts"
    );
  });

  test("should handle empty directories", () => {
    // Mock empty directories
    fs.readdirSync = mock(() => []);

    const options = {
      basePath: "/test/path",
      awsService: "lambda",
      resource: "function",
    };

    const result = scanSampleDirectory(options);

    // Verify empty directories result in empty files/arrays
    expect(result.unitRequest.inputFile).toBe("");
    expect(result.unitRequest.inputRefFiles).toEqual([]);
    expect(result.unitRequest.outputRefFiles).toEqual([]);
    expect(result.sourceRequest.inputFile).toBe("");
    expect(result.sourceRequest.outputRefFiles).toEqual([]);
  });
});

describe("extractInfoFromUrl", () => {
  test("extracts service and resource from standard CDK URL", () => {
    const url =
      "https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-sqs/lib/queue.ts";
    const result = extractInfoFromUrl(url);

    expect(result.service).toBe("sqs");
    expect(result.resource).toBe("queue");
    expect(result.rawUrl).toBe(
      "https://raw.githubusercontent.com/aws/aws-cdk/v2.185.0/packages/aws-cdk-lib/aws-sqs/lib/queue.ts"
    );
  });

  test("extracts service and resource from URL with different version", () => {
    const url =
      "https://github.com/aws/aws-cdk/blob/main/packages/aws-cdk-lib/aws-lambda/lib/function.ts";
    const result = extractInfoFromUrl(url);

    expect(result.service).toBe("lambda");
    expect(result.resource).toBe("function");
    expect(result.rawUrl).toBe(
      "https://raw.githubusercontent.com/aws/aws-cdk/main/packages/aws-cdk-lib/aws-lambda/lib/function.ts"
    );
  });

  test("extracts service and resource from URL with hyphenated resource name", () => {
    const url =
      "https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-apigateway/lib/resource-policy.ts";
    const result = extractInfoFromUrl(url);

    expect(result.service).toBe("apigateway");
    expect(result.resource).toBe("resource-policy");
    expect(result.rawUrl).toBe(
      "https://raw.githubusercontent.com/aws/aws-cdk/v2.185.0/packages/aws-cdk-lib/aws-apigateway/lib/resource-policy.ts"
    );
  });

  test("extracts service and resource from URL with test file", () => {
    const url =
      "https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-sqs/test/sqs.test.ts";
    const result = extractInfoFromUrl(url);

    expect(result.service).toBe("sqs");
    expect(result.resource).toBe("sqs.test"); // Note: This might not be ideal, but it's the current behavior
    expect(result.rawUrl).toBe(
      "https://raw.githubusercontent.com/aws/aws-cdk/v2.185.0/packages/aws-cdk-lib/aws-sqs/test/sqs.test.ts"
    );
  });

  test("handles service with dash in name", () => {
    const url =
      "https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-api-gateway/lib/method.ts";
    const result = extractInfoFromUrl(url);

    expect(result.service).toBe("api-gateway");
    expect(result.resource).toBe("method");
    expect(result.rawUrl).toBe(
      "https://raw.githubusercontent.com/aws/aws-cdk/v2.185.0/packages/aws-cdk-lib/aws-api-gateway/lib/method.ts"
    );
  });

  test("throws error for invalid URL", () => {
    const invalidUrl = "not-a-valid-url";

    expect(() => {
      extractInfoFromUrl(invalidUrl);
    }).toThrow();
  });
});

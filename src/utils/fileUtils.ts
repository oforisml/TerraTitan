import { readFileSync } from "fs";
import { FileType } from "../types";

/**
 * Detect file type based on content and path
 * @param filePath Path to the file
 * @returns The detected file type
 */
export function detectFileType(filePath: string): FileType {
  const content = readFileSync(filePath, "utf-8");

  // Check if it's a test file
  if (
    filePath.includes(".test.") ||
    filePath.includes(".spec.") ||
    filePath.includes("/__tests__/") ||
    content.includes("import { test } from ") ||
    content.includes("import { describe, it } from ") ||
    content.includes("import { expect } from ")
  ) {
    return FileType.TEST;
  }

  return FileType.SOURCE;
}

/**
 * Check if the file is a test file
 * @param filePath Path to the file
 * @returns True if it's a test file
 */
export function isTestFile(filePath: string): boolean {
  return detectFileType(filePath) === FileType.TEST;
}

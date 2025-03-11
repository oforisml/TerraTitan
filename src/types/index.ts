/**
 * Represents an AWS CDK construct
 */
export interface AwsCdkConstruct {
  name: string;
  filePath: string;
  imports: string[];
  properties: Record<string, any>;
  methods: string[];
  dependencies: string[];
  source: string; // Original source code
  fileType?: FileType; // Adding fileType property
}

/**
 * Options for the conversion process
 */
export interface ConversionOptions {
  storePattern?: boolean;
  validateOutput?: boolean;
  timeout?: number;
  fileType?: FileType;
}

/**
 * Result of a validation check
 */
export interface ValidationResult {
  success: boolean;
  errors?: string[];
  warnings?: string[];
  testResults?: {
    passed: number;
    failed: number;
    details: Array<{ name: string; passed: boolean; message?: string }>;
  };
}

/**
 * Result of a conversion operation
 */
export interface ConversionResult {
  originalConstruct: AwsCdkConstruct;
  terraformCdkCode: string;
  validationResult: ValidationResult;
  similarPatterns: any[]; // Patterns found in vector DB
}

/**
 * Type of file being processed
 */
export enum FileType {
  SOURCE = "SOURCE",
  TEST = "TEST",
  CONFIG = "CONFIG",
  UNKNOWN = "UNKNOWN",
}

#!/usr/bin/env node
import { Command } from "commander";
import { convertConstruct } from "../core/converter";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname } from "path";
import { config } from "dotenv";
import { FileType } from "../types";
import { detectFileType } from "../utils/fileUtils";

// Load environment variables
config();

const program = new Command();

program
  .name("terra-titan")
  .description("Convert AWS CDK constructs to Terraform CDK")
  .version("0.1.0");

program
  .command("convert")
  .description("Convert an AWS CDK construct to Terraform CDK")
  .requiredOption("-s, --source <path>", "Path to the AWS CDK construct file")
  .option("-o, --output <path>", "Path to save the output Terraform CDK file")
  .option("--no-store", "Do not store the pattern in the vector database")
  .option("--no-validate", "Skip validation of the generated code")
  .option(
    "-t, --type <type>",
    "Specify file type (source or test)",
    (value) => {
      if (value !== "source" && value !== "test") {
        throw new Error('Type must be either "source" or "test"');
      }
      return value === "test" ? FileType.TEST : FileType.SOURCE;
    }
  )
  .action(async (options) => {
    try {
      console.log(`Converting ${options.source}...`);

      // Auto-detect file type if not specified
      const fileType = options.type || detectFileType(options.source);
      console.log(`File detected as: ${fileType} file`);

      const result = await convertConstruct(options.source, {
        storePattern: options.store !== false,
        validateOutput: options.validate !== false,
        fileType: fileType,
      });

      if (result.validationResult.success) {
        console.log("✅ Conversion successful!");
      } else {
        console.log("⚠️ Conversion completed with validation issues:");
        if (result.validationResult.errors) {
          result.validationResult.errors.forEach((err) =>
            console.error(`- ${err}`)
          );
        }
      }

      if (options.output) {
        const outputDir = dirname(options.output);

        if (!existsSync(outputDir)) {
          mkdirSync(outputDir, { recursive: true });
        }

        writeFileSync(options.output, result.terraformCdkCode);
        console.log(`Output saved to ${options.output}`);
      } else {
        console.log("\nGenerated Terraform CDK code:");
        console.log("----------------------------------------");
        console.log(result.terraformCdkCode);
        console.log("----------------------------------------");
      }
    } catch (error) {
      console.error("Error during conversion:", error);
      process.exit(1);
    }
  });

program.parse();

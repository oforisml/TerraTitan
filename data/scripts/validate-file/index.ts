import * as fs from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

function isValidTypeScriptSyntax(filePath: string): boolean {
  try {
    const absolutePath = resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      console.error(`Error: File '${filePath}' does not exist`);
      return false;
    }

    const sourceText = fs.readFileSync(absolutePath, "utf8");

    const result = ts.transpileModule(sourceText, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    });

    if (result.diagnostics && result.diagnostics.length > 0) {
      console.log("Syntax errors detected:");
      result.diagnostics.forEach((diagnostic) => {
        const message = ts.flattenDiagnosticMessageText(
          diagnostic.messageText,
          "\n"
        );
        console.log(message);
        return false;
      });
    }
    console.log("No syntax errors found!");
    return true;
  } catch (error: unknown) {
    console.error(`Error: ${(error as Error).message}`);
    return false;
  }
}

// Get the file path from command line arguments
const args = process.argv.slice(2);

if (args.length !== 1) {
  console.error("Usage: ts-node index.ts <file-path>");
  process.exit(1);
}

const result = isValidTypeScriptSyntax(args[0]!);
process.exit(result ? 0 : 1);

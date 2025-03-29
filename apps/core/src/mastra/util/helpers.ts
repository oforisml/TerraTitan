import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import * as ts from 'typescript';

// required for Hono / Dev Server ...
// __dirname is not defined in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Get the git root directory
export const gitRoot = execSync('git rev-parse --show-toplevel', {
  encoding: 'utf8',
  cwd: __dirname,
}).trim();

/**
 * Get the base name of a typescript declaration file
 */
export function dtsBaseName(file: string): string {
  return path.basename(file, '.d.ts');
}

/**
 * Get the base name of a CDKTF ref file:
 *
 * for example:
 * "data/constructs/index.d.ts" => "constructs"
 */
export function cdktfBaseName(file: string): string {
  return path.basename(path.dirname(file));
}
/**
 * Simulate retrieval/filtering for prompting with relevant information
 *
 * Beware, AI Slop from this point forward...
 */

interface GeneratedImport {
  moduleSpecifier: string;
  namedSymbols: Set<string>;
  namespaceImport?: string;
}

/**
 * Find the generated imports in the source text
 */
export function findGeneratedImports(sourceText: string) {
  const sourceFile = ts.createSourceFile('temp.ts', sourceText, ts.ScriptTarget.Latest, true);
  const generatedImports: Map<string, GeneratedImport> = new Map();

  // First pass: collect import declarations from generated modules.
  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      // Remove quotes from module specifier.
      const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
      if (moduleSpecifier.includes('.generated')) {
        const genImport: GeneratedImport = {
          moduleSpecifier,
          namedSymbols: new Set(),
        };

        if (node.importClause) {
          const { namedBindings } = node.importClause;
          if (namedBindings) {
            if (ts.isNamedImports(namedBindings)) {
              // Handle named imports, e.g., import { CfnConnection } from './events.generated';
              for (const element of namedBindings.elements) {
                genImport.namedSymbols.add(element.name.getText(sourceFile));
              }
            } else if (ts.isNamespaceImport(namedBindings)) {
              // Handle namespace imports, e.g., import * as ssm from './ssm.generated';
              genImport.namespaceImport = namedBindings.name.getText(sourceFile);
            }
          }
        }
        generatedImports.set(moduleSpecifier, genImport);
      }
    }
  });

  // Second pass: traverse the AST to find property accesses on namespace imports.
  function findPropertyAccess(node: ts.Node) {
    if (ts.isPropertyAccessExpression(node)) {
      const expr = node.expression;
      if (ts.isIdentifier(expr)) {
        // For each generated import, check if the identifier matches the namespace alias.
        for (const genImport of generatedImports.values()) {
          if (genImport.namespaceImport === expr.getText(sourceFile)) {
            // Add the property name (e.g., CfnParameter) to the set of named symbols.
            genImport.namedSymbols.add(node.name.getText(sourceFile));
          }
        }
      }
    }
    ts.forEachChild(node, findPropertyAccess);
  }
  ts.forEachChild(sourceFile, findPropertyAccess);

  // Convert our Map into a plain object for easier consumption.
  const result: Record<string, string[]> = {};
  generatedImports.forEach((genImport, moduleSpecifier) => {
    result[moduleSpecifier] = Array.from(genImport.namedSymbols);
  });
  return result;
}

/**
 * Returns true if a declaration’s name is one of the target symbols or related (e.g. "CfnConnectionProps")
 */
function isNameRelevant(name: string, filterSymbols: string[]): boolean {
  if (filterSymbols.includes(name)) {
    return true;
  }
  // Check for Props suffix and nested types
  for (const sym of filterSymbols) {
    if (name === `${sym}Props` || name.includes(`${sym}.`)) {
      return true;
    }
  }
  return false;
}

/**
 * Filters the given declaration source text so that only declarations related to
 * the provided symbols (classes, interfaces, functions, namespaces) are kept.
 *
 * @param sourceText The full declarations (as in a .d.ts file)
 * @param filterSymbols The list of symbol names (e.g. ["CfnConnection", "CfnRule"])
 */
export function filterGeneratedModule(sourceText: string, filterSymbols: string[]): string {
  const sourceFile = ts.createSourceFile('module.d.ts', sourceText, ts.ScriptTarget.Latest, true);

  // Transformer that recursively visits nodes and only keeps the ones we want.
  // The additional parameter 'inRelevantContext' tells us whether we're already inside
  // a relevant declaration (so we keep everything below it).
  const transformer = <T extends ts.Node>(context: ts.TransformationContext): ts.Transformer<T> => {
    function visit(node: ts.Node, inRelevantContext = false): ts.Node {
      // For container nodes, filter their statements.
      if (ts.isSourceFile(node) || ts.isModuleBlock(node)) {
        const filteredStatements = node.statements
          .map(st => visit(st, inRelevantContext))
          .filter((st): st is ts.Statement => st !== undefined);
        if (ts.isSourceFile(node)) {
          return ts.factory.updateSourceFile(node, filteredStatements);
        } else {
          return ts.factory.updateModuleBlock(node, filteredStatements);
        }
      }

      // Check for declarations: classes, interfaces, functions, and namespace/module declarations.
      if (
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isModuleDeclaration(node)
      ) {
        // If we're already inside a relevant declaration, keep everything.
        if (inRelevantContext) {
          return ts.visitEachChild(node, child => visit(child, true), context);
        }
        // Otherwise, if the declaration has a name and it is relevant...
        if (node.name && isNameRelevant(node.name.text, filterSymbols)) {
          // Mark children as relevant.
          return ts.visitEachChild(node, child => visit(child, true), context);
        }
        // Otherwise, check if any descendant declaration is relevant.
        let foundRelevant = false;
        function checkChild(n: ts.Node) {
          if (
            (ts.isClassDeclaration(n) ||
              ts.isInterfaceDeclaration(n) ||
              ts.isFunctionDeclaration(n) ||
              ts.isModuleDeclaration(n)) &&
            n.name &&
            isNameRelevant(n.name.text, filterSymbols)
          ) {
            foundRelevant = true;
          }
          ts.forEachChild(n, checkChild);
        }
        ts.forEachChild(node, checkChild);
        if (foundRelevant) {
          return ts.visitEachChild(node, child => visit(child, true), context);
        }
        // If neither the node nor any of its children are relevant, remove it.
        return ts.factory.createEmptyStatement();
      }
      // For other nodes, just continue recursing, preserving context.
      return ts.visitEachChild(node, child => visit(child, inRelevantContext), context);
    }
    return (node: T) => ts.visitNode(node, n => visit(n)) as T;
  };

  const result = ts.transform(sourceFile, [transformer]);
  const transformedSourceFile = result.transformed[0] as ts.SourceFile;
  const printer = ts.createPrinter();
  const output = printer.printFile(transformedSourceFile);
  result.dispose();

  // If the output only contains semicolons or whitespace, return empty string
  return output.replace(/^[\s;]*$/, '');
}

/**
 * Process input to extract and filter relevant declarations from inputRef
 */
export function filterInputRefFile(inputSource: string, inputRefSource: string): string {
  const importsByModule = findGeneratedImports(inputSource);

  // TODO: Validate the inputRefSource has all the necessary declarations

  // Collect all symbols from all generated imports
  const symbolsToFilter = Object.values(importsByModule).flatMap(symbols => symbols);

  // Filter the input reference file to only include relevant declarations
  const filteredDeclarations = filterGeneratedModule(inputRefSource, symbolsToFilter);

  return filteredDeclarations;
}

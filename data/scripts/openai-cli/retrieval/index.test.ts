import { expect, test, describe } from "bun:test";
import { filterGeneratedModule, findGeneratedImports } from "./index";

describe("findGeneratedImports", () => {
  test("should find generated imports", () => {
    const sourceText = `
      import { CfnConnection } from './events.generated';
      import * as ssm from './ssm.generated';

      const connection = new CfnConnection();
      const resource = new ssm.CfnParameter(this, 'Resource', {
        allowedPattern: 'abc',
        description: 'A parameter',
      });
    `;

    const result = findGeneratedImports(sourceText);

    expect(result).toEqual({
      "./events.generated": ["CfnConnection"],
      "./ssm.generated": ["CfnParameter"],
    });
  });

  test("should handle multiple named imports", () => {
    const sourceText = `
      import { CfnConnection, CfnRule } from './events.generated';
    `;

    const result = findGeneratedImports(sourceText);

    expect(result).toEqual({
      "./events.generated": ["CfnConnection", "CfnRule"],
    });
  });

  test("should handle namespace imports with property access", () => {
    const sourceText = `
      import * as cdk from './cdk.generated';
      cdk.Stack.create();
      cdk.App.build();
    `;

    const result = findGeneratedImports(sourceText);

    expect(result).toEqual({
      "./cdk.generated": ["Stack", "App"],
    });
  });
});

describe("filterGeneratedModule", () => {
  test("should keep declarations for specified symbols and their related types", () => {
    const generatedDeclaration = `
import * as cdk from "../../core";
import * as constructs from "constructs";

export declare class CfnApiDestination extends cdk.CfnResource implements cdk.IInspectable {
  public readonly x: string;
}

export interface CfnApiDestinationProps {
  readonly prop1: string;
}

export declare class CfnConnection extends cdk.CfnResource implements cdk.IInspectable {
  public readonly y: string;
}

export declare namespace CfnConnection {
  interface AuthParametersProperty {
    readonly apiKeyAuthParameters?: ApiKeyAuthParametersProperty;
  }
  interface ApiKeyAuthParametersProperty {
    readonly apiKeyName: string;
    readonly apiKeyValue: string;
  }
}

export interface CfnConnectionProps {
  readonly prop2: string;
}`;

    const result = filterGeneratedModule(generatedDeclaration, [
      "CfnConnection",
    ]);

    // Verify CfnConnection and related declarations are kept
    expect(result).toMatchSnapshot();
    expect(result).toContain("export declare class CfnConnection");
    expect(result).toContain("export interface CfnConnectionProps");
    expect(result).toContain("export declare namespace CfnConnection");
    expect(result).toContain("interface AuthParametersProperty");
    expect(result).toContain("interface ApiKeyAuthParametersProperty");

    // Verify unrelated declarations are removed
    expect(result).not.toContain("CfnApiDestination");
    expect(result).not.toContain("CfnApiDestinationProps");
  });

  test("should handle multiple symbols", () => {
    const generatedDeclaration = `
export declare class CfnRule extends Resource {
  public readonly x: string;
}

export interface CfnRuleProps {
  readonly prop1: string;
}

export declare class CfnConnection extends Resource {
  public readonly y: string;
}

export declare class OtherClass extends Resource {
  public readonly z: string;
}`;

    const result = filterGeneratedModule(generatedDeclaration, [
      "CfnConnection",
      "CfnRule",
    ]);

    expect(result).toContain("export declare class CfnConnection");
    expect(result).toContain("export declare class CfnRule");
    expect(result).toContain("export interface CfnRuleProps");
    expect(result).not.toContain("export declare class OtherClass");
  });

  test("should handle empty input", () => {
    const result = filterGeneratedModule("", ["CfnConnection"]);
    expect(result).toBe("");
  });

  test("should handle cases where no symbols match", () => {
    const generatedDeclaration = `
export declare class SomeClass {
  public readonly x: string;
}`;

    const result = filterGeneratedModule(generatedDeclaration, [
      "NonExistentSymbol",
    ]);
    expect(result.trim()).toBe("");
  });
});

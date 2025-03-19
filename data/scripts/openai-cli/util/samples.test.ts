import { expect, test, describe } from "bun:test";
import { filterInputRefFile } from "./request";

describe("filterInputRefFile", () => {
  test("should process input file and filter declarations", async () => {
    const inputSource = `
      import { CfnConnection } from './events.generated';
      import * as ssm from './ssm.generated';

      const connection = new CfnConnection();
      const resource = new ssm.CfnParameter(this, 'Resource', {});
    `;

    const inputRefSource = `
      export declare class CfnConnection {
        public readonly x: string;
      }
      export interface CfnConnectionProps {
        readonly prop1: string;
      }
      export declare class OtherClass {
        public readonly y: string;
      }
    `;
    const result = filterInputRefFile(inputSource, inputRefSource);

    expect(result).toContain("export declare class CfnConnection");
    expect(result).toContain("export interface CfnConnectionProps");
    expect(result).not.toContain("export declare class OtherClass");
  });
});

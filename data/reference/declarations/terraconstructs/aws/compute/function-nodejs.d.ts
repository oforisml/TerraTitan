import { TerraformAsset } from "cdktf";
import { Construct } from "constructs";
import { LambdaFunction, FunctionProps } from "./function";
import { IFunction } from "./function-base";
export interface NodejsFunctionProps extends FunctionProps {
    /**
     * The path to the Handler entry point script, relative to the Spec file.
     *
     * This script will be bundled using
     * [esbuild-wasm](https://esbuild.github.io/getting-started/#wasm).
     */
    readonly path: string;
    /**
     * You can mark a file or a package as external to exclude it from your
     * build. Instead of being bundled, the import will be preserved (using
     * require for the iife and cjs formats and using import for the esm
     * format) and will be evaluated at run time instead.
     *
     * @link https://esbuild.github.io/api/#external
     *
     * @default []
     */
    readonly external?: string[];
    /**
     * The NodeJS runtime for the Lambda function.
     *
     * @link https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html#runtimes-supported
     *
     * @default "nodejs20.x"
     */
    readonly runtime?: "nodejs18.x" | "nodejs20.x";
}
/**
 * Provides a NodeJS Lambda Function. Lambda allows you to trigger execution
 * of code in response to events in AWS, enabling serverless backend solutions.
 *
 * The Lambda Function itself will be bundled using
 * [esbuild-wasm](https://esbuild.github.io/getting-started/#wasm).
 *
 * For example:
 *
 * ```ts
 * const fn = new compute.NodejsFunction(spec, "HelloWorld", {
 *   path: path.join(__dirname, "handlers", "hello-world.ts"),
 * });
 * ```
 *
 * @resource aws_lambda_function
 * @beacon-class compute.IFunction
 */
export declare class NodejsFunction extends LambdaFunction implements IFunction {
    readonly asset: TerraformAsset;
    readonly bundledPath: string;
    constructor(scope: Construct, id: string, config: NodejsFunctionProps);
}

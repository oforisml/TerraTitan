import { TerraformStack, StackAnnotation } from "cdktf";
import { TerraformConstructor } from "cdktf/lib/testing/matchers";
export interface SynthOptions {
    /**
     * snapshot full synthesized template
     */
    snapshot?: boolean;
    /**
     * Run all validations on the stack before synth
     */
    runValidations?: boolean;
}
/**
 * Helper class to create Jest Matchers for a TerraformStack
 */
export declare class Template {
    /**
     * Create Jest Matchers from the parsed synthesized spec
     *
     * Best for common Jest Matchers
     *
     * This always runs TerraformStack.prepareStack() as this
     * library heavily depends on it for pre-synth resource
     * generation.
     */
    static fromStack(stack: TerraformStack, options?: SynthOptions): jest.JestMatchers<any>;
    /**
     * Create Jest Matchers for the synthesized JSON string
     *
     * Required by the CDKTF Jest Matchers (toHaveResourceWithProperties, ...)
     *
     * This always runs TerraformStack.prepareStack() as this
     * library heavily depends on it for pre-synth resource
     * generation.
     */
    static synth(stack: TerraformStack, options?: SynthOptions): jest.JestMatchers<any>;
    static expectStacksEqual(stack1: TerraformStack, stack2: TerraformStack): void;
    /**
     * Create Jest Matchers for stack resources of a specific type
     *
     * This always runs TerraformStack.prepareStack() as this
     * library heavily depends on it for pre-synth resource
     * generation.
     */
    static resources(stack: TerraformStack, type: TerraformConstructor, options?: SynthOptions): jest.JestMatchers<object[]>;
    /**
     * Get stack resources by type
     */
    static resourceObjects(stack: TerraformStack, type: TerraformConstructor, options?: SynthOptions): object;
    /**
     * Create Jest Matchers for stack outputs of a specific type
     *
     * This always runs TerraformStack.prepareStack() as this
     * library heavily depends on it for pre-synth resource
     * generation.
     */
    static dataSources(stack: TerraformStack, type: TerraformConstructor, options?: SynthOptions): jest.JestMatchers<object[]>;
    /**
     * Create Jest Matchers for a specific stack output or
     * throw an error if the output is not found
     *
     * This always runs TerraformStack.prepareStack() as this
     * library heavily depends on it for pre-synth resource
     * generation.
     */
    static expectOutput(stack: TerraformStack, outputName: string, options?: SynthOptions): jest.JestMatchers<object | undefined>;
    private static getSynthString;
    private readonly raw;
    private readonly template;
    constructor(stack: TerraformStack, options?: SynthOptions);
    get expect(): jest.JestMatchers<any>;
    toMatchObject(o: object): void;
    get resource(): object | undefined;
    /**
     * Get an Object of resources by type,
     * the key is the resource name and the value is the resource object
     */
    resourcesByType(type: TerraformConstructor): object;
    /**
     * Get an Array of resources by type, discarding the resource names
     */
    resourceTypeArray(type: TerraformConstructor): Array<object>;
    /**
     * Jest Matcher for resourceTypeArray
     *
     * shortcut for expect(template.resourceTypeArray(type))
     */
    expectResources(type: TerraformConstructor): jest.JestMatchers<any>;
    resourceCountIs(type: TerraformConstructor, count: number): void;
    resourceTypeArrayContaining(type: TerraformConstructor, object: any): void;
    resourceTypeArrayNotContaining(type: TerraformConstructor, object: any): void;
    get data(): object | undefined;
    dataSourcesByType(type: TerraformConstructor): object;
    /**
     * Get an Array of datasources by type, discarding the resource names
     */
    dataSourceTypeArray(type: TerraformConstructor): Array<object>;
    get output(): object | undefined;
    outputByName(name: string): object | undefined;
}
export declare class Annotations {
    private readonly annotations;
    static fromStack(stack: TerraformStack): Annotations;
    private constructor();
    get warnings(): StackAnnotation[];
    get errors(): StackAnnotation[];
    /**
     * check if the stack has a warning for certain context path and message
     */
    hasWarnings(...expectedWarnings: Array<Partial<StackAnnotationMatcher>>): void;
    /**
     * ensure the stack has no warning for certain context path and message
     */
    hasNoWarnings(...expectedWarnings: Array<Partial<StackAnnotationMatcher>>): void;
    private warningMatcher;
    /**
     * check if the stack has an error for certain context path and message
     */
    hasErrors(...expectedErrors: Array<Partial<StackAnnotationMatcher>>): void;
}
export interface StackAnnotationMatcher {
    constructPath: string | RegExp;
    message: string | RegExp;
}

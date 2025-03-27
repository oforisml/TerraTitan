import { TerraformMetaArguments, TerraformResource } from "cdktf";
import { Construct } from "constructs";
export declare enum TestProviderMetadata {
    TYPE = "test"
}
export interface TestResourceConfig extends TerraformMetaArguments {
    readonly properties?: {
        [name: string]: any;
    };
}
export declare class TestResource extends TerraformResource {
    static readonly tfResourceType: string;
    constructor(scope: Construct, id: string, config: TestResourceConfig);
    get names(): string[];
    protected synthesizeAttributes(): {
        [name: string]: any;
    };
}

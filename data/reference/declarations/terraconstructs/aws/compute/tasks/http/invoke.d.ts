import { Construct } from "constructs";
import * as compute from "../../";
import * as iam from "../../../iam";
import * as notify from "../../../notify";
/**
 * The style used when applying URL encoding to array values.
 */
export declare enum URLEncodingFormat {
    /**
     * Encode arrays using brackets. For example, {'array': ['a','b','c']} encodes to 'array[]=a&array[]=b&array[]=c'
     */
    BRACKETS = "BRACKETS",
    /**
     * Encode arrays using commas. For example, {'array': ['a','b','c']} encodes to 'array=a,b,c,d'
     */
    COMMAS = "COMMAS",
    /**
     * Apply the default URL encoding style (INDICES).
     */
    DEFAULT = "DEFAULT",
    /**
     * Encode arrays using the index value. For example, {'array': ['a','b','c']} encodes to 'array[0]=a&array[1]=b&array[2]=c'
     */
    INDICES = "INDICES",
    /**
     * Do not apply URL encoding.
     */
    NONE = "NONE",
    /**
     * Repeat key for each item in the array. For example, {'array': ['a','b','c']} encodes to 'array[]=a&array[]=b&array[]=c'
     */
    REPEAT = "REPEAT"
}
/**
 * Properties for calling an external HTTP endpoint with HttpInvoke.
 */
export interface HttpInvokeProps extends compute.TaskStateBaseProps {
    /**
     * Permissions are granted to call all resources under this path.
     *
     * @example 'https://api.example.com'
     */
    readonly apiRoot: string;
    /**
     * The API endpoint to call, relative to `apiRoot`.
     * @example compute.TaskInput.fromText('path/to/resource')
     */
    readonly apiEndpoint: compute.TaskInput;
    /**
     * The HTTP method to use.
     *
     * @example compute.TaskInput.fromText('GET')
     */
    readonly method: compute.TaskInput;
    /**
     * The EventBridge Connection to use for authentication.
     */
    readonly connection: notify.IConnection;
    /**
     * The body to send to the HTTP endpoint.
     *
     * @default - No body is sent with the request.
     */
    readonly body?: compute.TaskInput;
    /**
     * The headers to send to the HTTP endpoint.
     *
     * @example compute.TaskInput.fromObject({ 'Content-Type': 'application/json' })
     *
     * @default - No additional headers are added to the request.
     */
    readonly headers?: compute.TaskInput;
    /**
     * The query string parameters to send to the HTTP endpoint.
     * @default - No query string parameters are sent in the request.
     */
    readonly queryStringParameters?: compute.TaskInput;
    /**
     * Determines whether to apply URL encoding to the request body, and which array encoding format to use.
     *
     * `URLEncodingFormat.NONE` passes the JSON-serialized `RequestBody` field as the HTTP request body.
     * Otherwise, the HTTP request body is the URL-encoded form data of the `RequestBody` field using the
     * specified array encoding format, and the `Content-Type` header is set to `application/x-www-form-urlencoded`.
     *
     * @default - URLEncodingFormat.NONE
     */
    readonly urlEncodingFormat?: URLEncodingFormat;
}
/**
 * A Step Functions Task to call a public third-party API.
 */
export declare class HttpInvoke extends compute.TaskStateBase {
    private readonly props;
    protected readonly taskPolicies?: iam.PolicyStatement[];
    constructor(scope: Construct, id: string, props: HttpInvokeProps);
    /**
     * Provides the HTTP Invoke service integration task configuration.
     *
     * @internal
     */
    protected _renderTask(): any;
    protected buildTaskPolicyStatements(): iam.PolicyStatement[];
    private buildTaskParameters;
}

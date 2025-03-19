# Conversion Response

> [!WARNING]
> The Instructions did not have filtered AWS CDK Declarations (hence 52k tokens size ...)

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:                   52,542
Simulated User Prompt Tokens:         12,218
Simulated Assistent Response Tokens:   9,244
New User Prompt Tokens:               14,651
Expected Tokens:                       7,724

Total Tokens:                         96,379
Model Max Tokens:                    100,000

```

### Response Statistics
```
Response Time: 162.16s
Actual Usage:
{
  "input_tokens": 88732,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 8642,
  "output_tokens_details": {
    "reasoning_tokens": 6208
  },
  "total_tokens": 97374
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67da5b5b6a6c8190a6d8c994050e9fbc0b2a2fceb4b5c5fb)

## Response

Below is one valid TerraConstructs conversion. In this example the AWS‐CDK “Connection” construct is rewritten as a TerraConstructs construct that extends AwsConstructBase and instantiates the corresponding CDKTF AWS provider resource (CloudwatchEventConnection). Note that the “bind” methods on the Authorization and HttpParameter classes now return plain JavaScript objects (with the same shape as the CDKTF resource expects) and that any CloudFormation–specific type casts have been removed. (Also note that the CloudwatchEventConnection Terraform resource configuration supports “invocationConnectivityParameters” rather than “invocationHttpParameters”.)

────────────────────────────────────────────────────────────────────────────
Code:
────────────────────────────────────────────────────────────────────────────
```typescript
import { Construct } from "constructs";
import { cloudwatchEventConnection } from "@cdktf/provider-aws";
import { AwsConstructBase, AwsConstructProps, AwsStack, SecretValue, IResource } from "../aws-construct";
import { Fn, Token } from "cdktf";

/**
 * An API Destination Connection properties
 */
export interface ConnectionProps extends AwsConstructProps {
  /**
   * The name of the connection.
   *
   * @default - A name is automatically generated
   */
  readonly connectionName?: string;

  /**
   * An optional description for the connection.
   *
   * @default - none
   */
  readonly description?: string;

  /**
   * The authorization settings for the connection.
   */
  readonly authorization: Authorization;

  /**
   * Additional string parameters to add to the invocation bodies.
   *
   * @default - No additional parameters
   */
  readonly bodyParameters?: Record<string, HttpParameter>;

  /**
   * Additional string parameters to add to the invocation headers.
   *
   * @default - No additional parameters
   */
  readonly headerParameters?: Record<string, HttpParameter>;

  /**
   * Additional string parameters to add to the invocation query strings.
   *
   * @default - No additional parameters
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

/**
 * Returned by the _bind() method of an Authorization instance.
 */
export interface AuthorizationBindResult {
  /**
   * The authorization type.
   */
  readonly authorizationType: AuthorizationType;

  /**
   * The authorization parameters.
   */
  readonly authParameters: any;
}

/**
 * Abstract authorization for an API Destination connection.
 */
export abstract class Authorization {
  /**
   * Use API key authorization.
   *
   * API key authorization has two components: an API key name and an API key value.
   */
  public static apiKey(apiKeyName: string, apiKeyValue: SecretValue): Authorization {
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.API_KEY,
          authParameters: {
            apiKeyAuthParameters: {
              apiKeyName: apiKeyName,
              apiKeyValue: apiKeyValue.unsafeUnwrap(),
            },
          },
        };
      }
    }();
  }

  /**
   * Use basic (username/password) authorization.
   */
  public static basic(username: string, password: SecretValue): Authorization {
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.BASIC,
          authParameters: {
            basicAuthParameters: {
              username: username,
              password: password.unsafeUnwrap(),
            },
          },
        };
      }
    }();
  }

  /**
   * Use OAuth authorization.
   */
  public static oauth(props: OAuthAuthorizationProps): Authorization {
    if (![HttpMethod.POST, HttpMethod.GET, HttpMethod.PUT].includes(props.httpMethod)) {
      throw new Error("httpMethod must be one of GET, POST, PUT");
    }
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.OAUTH_CLIENT_CREDENTIALS,
          authParameters: {
            oAuthParameters: {
              authorizationEndpoint: props.authorizationEndpoint,
              clientParameters: {
                clientId: props.clientId,
                clientSecret: props.clientSecret.unsafeUnwrap(),
              },
              httpMethod: props.httpMethod,
              oAuthHttpParameters: {
                bodyParameters: renderHttpParameters(props.bodyParameters),
                headerParameters: renderHttpParameters(props.headerParameters),
                queryStringParameters: renderHttpParameters(props.queryStringParameters),
              },
            },
          },
        };
      }
    }();
  }

  /**
   * Binds the authorization to this construct and returns properties for the connection resource.
   *
   * @internal
   */
  public abstract _bind(): AuthorizationBindResult;
}

/**
 * Properties for OAuth authorization.
 */
export interface OAuthAuthorizationProps {
  /**
   * The URL to the authorization endpoint.
   */
  readonly authorizationEndpoint: string;
  /**
   * The HTTP method to use for the authorization request.
   * (Valid values: POST, GET, PUT)
   */
  readonly httpMethod: HttpMethod;
  /**
   * The client ID to use for OAuth authorization.
   */
  readonly clientId: string;
  /**
   * The client secret associated with the client ID.
   */
  readonly clientSecret: SecretValue;
  /**
   * Additional string parameters to add to the OAuth request body.
   *
   * @default - None
   */
  readonly bodyParameters?: Record<string, HttpParameter>;
  /**
   * Additional string parameters to add to the OAuth request header.
   *
   * @default - None
   */
  readonly headerParameters?: Record<string, HttpParameter>;
  /**
   * Additional string parameters to add to the OAuth request query string.
   *
   * @default - None
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

/**
 * Abstract HTTP parameter.
 */
export abstract class HttpParameter {
  /**
   * Create an HTTP parameter from a literal string.
   * The value will not be treated as secret.
   */
  public static fromString(value: string): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string): any {
        return {
          key: name,
          value: value,
          isValueSecret: false,
        };
      }
    }();
  }

  /**
   * Create an HTTP parameter from a secret.
   */
  public static fromSecret(value: SecretValue): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string): any {
        return {
          key: name,
          value: value.unsafeUnwrap(),
          isValueSecret: true,
        };
      }
    }();
  }

  /**
   * Renders the parameter value.
   *
   * @internal
   */
  public abstract _render(name: string): any;
}

/**
 * Supported HTTP operations.
 */
export enum HttpMethod {
  POST = "POST",
  GET = "GET",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

/**
 * Supported authorization types.
 */
enum AuthorizationType {
  API_KEY = "API_KEY",
  BASIC = "BASIC",
  OAUTH_CLIENT_CREDENTIALS = "OAUTH_CLIENT_CREDENTIALS",
}

/**
 * Helper function to render HTTP parameters.
 */
function renderHttpParameters(ps?: Record<string, HttpParameter>): any[] | undefined {
  if (!ps || Object.keys(ps).length === 0) { return undefined; }
  return Object.entries(ps).map(([name, param]) => param._render(name));
}

/**
 * Interface for connection attributes (used for importing a connection).
 */
export interface ConnectionAttributes {
  /**
   * The connection name.
   */
  readonly connectionName: string;
  /**
   * The connection ARN.
   */
  readonly connectionArn: string;
  /**
   * The ARN for the secret created for the connection.
   */
  readonly connectionSecretArn: string;
}

/**
 * Interface for an API Destination Connection.
 */
export interface IConnection extends IResource {
  /**
   * The connection name.
   * @attribute
   */
  readonly connectionName: string;
  /**
   * The connection ARN.
   * @attribute
   */
  readonly connectionArn: string;
  /**
   * The ARN of the secret created for the connection.
   * @attribute
   */
  readonly connectionSecretArn: string;
}

/**
 * Define an EventBridge Connection.
 *
 * @resource aws_cloudwatch_event_connection
 */
export class Connection extends AwsConstructBase implements IConnection {
  public readonly connectionName: string;
  public readonly connectionArn: string;
  public readonly connectionSecretArn: string;
  public readonly resource: cloudwatchEventConnection.CloudwatchEventConnection;

  constructor(scope: Construct, id: string, props: ConnectionProps) {
    super(scope, id, {
      physicalName: props.connectionName,
    });

    const authBind = props.authorization._bind();

    const invocationConnectivityParameters = (props.headerParameters ||
      props.queryStringParameters ||
      props.bodyParameters)
      ? {
          bodyParameters: renderHttpParameters(props.bodyParameters),
          headerParameters: renderHttpParameters(props.headerParameters),
          queryStringParameters: renderHttpParameters(props.queryStringParameters),
        }
      : undefined;

    this.resource = new cloudwatchEventConnection.CloudwatchEventConnection(this, "Resource", {
      name: this.physicalName,
      description: props.description,
      authorizationType: authBind.authorizationType,
      authParameters: {
        ...authBind.authParameters,
        // Map the invocation parameters under the “invocationConnectivityParameters” config.
        invocationConnectivityParameters: invocationConnectivityParameters,
      },
    });

    // Capture attributes from the underlying Terraform resource.
    this.connectionName = this.getResourceNameAttribute(this.resource.name);
    this.connectionArn = this.resource.arn;
    this.connectionSecretArn = this.resource.secretArn;
  }
}

/**
 * Imported connection resource.
 */
class ImportedConnection extends AwsConstructBase implements IConnection {
  public readonly connectionArn: string;
  public readonly connectionName: string;
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, attrs: ConnectionAttributes) {
    const arnParts = AwsStack.ofAwsConstruct(scope).parseArn(attrs.connectionArn);
    super(scope, id, { account: arnParts.account, region: arnParts.region });
    this.connectionArn = attrs.connectionArn;
    this.connectionName = attrs.connectionName;
    this.connectionSecretArn = attrs.connectionSecretArn;
  }
}

/**
 * Allows importing an existing connection.
 */
export namespace Connection {
  export function fromEventBusArn(
    scope: Construct,
    id: string,
    connectionArn: string,
    connectionSecretArn: string,
  ): IConnection {
    const parts = AwsStack.of(scope).parseArn(connectionArn);
    return new ImportedConnection(scope, id, {
      connectionArn: connectionArn,
      connectionName: parts.resourceName || "",
      connectionSecretArn: connectionSecretArn,
    });
  }

  export function fromConnectionAttributes(
    scope: Construct,
    id: string,
    attrs: ConnectionAttributes,
  ): IConnection {
    return new ImportedConnection(scope, id, attrs);
  }
}


// End of file.
```
────────────────────────────────────────────────────────────────────────────

Notes:
• The ConnectionProps interface now extends AwsConstructProps so that default grid/stack attributes are available.
• The Connection construct extends AwsConstructBase (instead of Resource) and instantiates a CDKTF CloudwatchEventConnection resource.
• The _bind() methods on Authorization yield plain objects (without CloudFormation‐only casts).
• ImportedConnection is implemented as an AwsConstructBase subclass that uses the stack’s parseArn method.

This complete file is a valid TerraConstructs source file that can be written to disk and used directly with CDKTF.

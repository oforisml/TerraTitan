# Conversion Response

> [!WARNING]
> The Instructions has filtered AWS CDK Declarations (hence 31k tokens size ...)

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:                   31,554
Simulated User Prompt Tokens:         12,218
Simulated Assistent Response Tokens:   9,244
New User Prompt Tokens:               14,651
Expected Tokens:                       7,724

Total Tokens:                         75,391
Model Max Tokens:                    100,000

```

### Response Statistics
```
Response Time: 62.68s
Actual Usage:
{
  "input_tokens": 67744,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 7966,
  "output_tokens_details": {
    "reasoning_tokens": 5248
  },
  "total_tokens": 75710
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67da66752e1081909c207b38a4ed9d9205f22527e9983efc)

## Response

Below is one complete TerraConstruct‐based TypeScript source file that follows the conversion guidelines. (In this example we assume that the AWS CDK constructs that used “CfnConnection” now use the CDKTF provider’s CloudwatchEventConnection resource. You may need to adjust import paths if your project uses different module names.)

────────────────────────────
```typescript
/* file: connection.ts */
import { Construct } from "constructs";
import { CloudwatchEventConnection } from "@cdktf/provider-aws/cloudwatch-event-connection";
import { AwsConstructBase, AwsConstructProps, IAwsConstruct } from "../aws-construct";
import { AwsStack } from "../aws-stack";
import { SecretValue, Token, Fn } from "../../core";  // adjust if needed
import * as iam from "../iam";

/**
 * Properties for defining an API Destination Connection.
 */
export interface ConnectionProps extends AwsConstructProps {
  /**
   * The name of the connection.
   *
   * @default - A name is automatically generated
   */
  readonly connectionName?: string;
  /**
   * A description of the connection.
   *
   * @default - none
   */
  readonly description?: string;
  /**
   * The authorization type and credentials for this connection.
   */
  readonly authorization: Authorization;
  /**
   * Additional string parameters to add to the invocation body.
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
   * Additional string parameters to add to the invocation query string.
   *
   * @default - No additional parameters
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

/**
 * Properties for using OAuth authorization.
 */
export interface OAuthAuthorizationProps {
  /**
   * The URL of the authorization endpoint.
   */
  readonly authorizationEndpoint: string;
  /**
   * The HTTP method to use for the authorization request.
   * (Only GET, POST or PUT are allowed.)
   */
  readonly httpMethod: HttpMethod;
  /**
   * The client ID for OAuth authorization.
   */
  readonly clientId: string;
  /**
   * The client secret for OAuth authorization.
   */
  readonly clientSecret: SecretValue;
  /**
   * Additional string parameters to add to the OAuth request body.
   *
   * @default - No additional parameters
   */
  readonly bodyParameters?: Record<string, HttpParameter>;
  /**
   * Additional string parameters to add to the OAuth request header.
   *
   * @default - No additional parameters
   */
  readonly headerParameters?: Record<string, HttpParameter>;
  /**
   * Additional string parameters to add to the OAuth request query string.
   *
   * @default - No additional parameters
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

/**
 * An authorization “binding result” – the result of binding an Authorization to obtain the authorization type and parameters.
 */
export interface AuthorizationBindResult {
  /**
   * The type of authorization.
   */
  readonly authorizationType: string;
  /**
   * The authorization parameters.
   */
  readonly authParameters: any;
}

/**
 * An abstract class that defines the credentials and parameters used to authorize a connection.
 */
export abstract class Authorization {
  /**
   * Use API key authorization.
   *
   * @param apiKeyName the key name
   * @param apiKeyValue the API key value as a SecretValue
   */
  public static apiKey(apiKeyName: string, apiKeyValue: SecretValue): Authorization {
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.API_KEY,
          authParameters: {
            apiKeyAuthParameters: {
              apiKeyName: apiKeyName,
              apiKeyValue: apiKeyValue.unsafeUnwrap(), // safe usage
            },
          } as CloudwatchEventConnection.AuthParametersProperty,
        };
      }
    }();
  }

  /**
   * Use basic (username/password) authorization.
   *
   * @param username the username.
   * @param password the password as a SecretValue.
   */
  public static basic(username: string, password: SecretValue): Authorization {
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.BASIC,
          authParameters: {
            basicAuthParameters: {
              username: username,
              password: password.unsafeUnwrap(), // safe usage
            },
          } as CloudwatchEventConnection.AuthParametersProperty,
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
                clientSecret: props.clientSecret.unsafeUnwrap(), // safe usage
              },
              httpMethod: props.httpMethod,
              oAuthHttpParameters: {
                bodyParameters: renderHttpParameters(props.bodyParameters),
                headerParameters: renderHttpParameters(props.headerParameters),
                queryStringParameters: renderHttpParameters(props.queryStringParameters),
              },
            },
          } as CloudwatchEventConnection.AuthParametersProperty,
        };
      }
    }();
  }

  /**
   * Abstract method to bind the authorization to the construct.
   */
  public abstract _bind(): AuthorizationBindResult;
}

/**
 * An abstract HTTP parameter to be sent with a connection’s invocation or OAuth request.
 */
export abstract class HttpParameter {
  /**
   * Create a parameter from a plain string.
   *
   * The value is not secret.
   */
  public static fromString(value: string): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return {
          key: name,
          value: value,
          isValueSecret: false,
        } as CloudwatchEventConnection.ParameterProperty;
      }
    }();
  }

  /**
   * Create a parameter from a secret.
   */
  public static fromSecret(value: SecretValue): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return {
          key: name,
          value: value.unsafeUnwrap(), // safe usage
          isValueSecret: true,
        } as CloudwatchEventConnection.ParameterProperty;
      }
    }();
  }

  /**
   * Render this parameter.
   *
   * @internal
   */
  public abstract _render(name: string): any;
}

/**
 * The interface for a Connection construct.
 */
export interface IConnection extends IAwsConstruct {
  /**
   * The name of the connection.
   *
   * @attribute
   */
  readonly connectionName: string;
  /**
   * The ARN of the connection.
   *
   * @attribute
   */
  readonly connectionArn: string;
  /**
   * The ARN for the secret created for the connection.
   *
   * @attribute
   */
  readonly connectionSecretArn: string;
  /**
   * Adds a statement to the IAM resource policy associated with the connection.
   */
  addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult;
}

/**
 * Import attributes for a connection.
 */
export interface ConnectionAttributes {
  readonly connectionName: string;
  readonly connectionArn: string;
  readonly connectionSecretArn: string;
}

/**
 * Supported HTTP methods.
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
export enum AuthorizationType {
  API_KEY = "API_KEY",
  BASIC = "BASIC",
  OAUTH_CLIENT_CREDENTIALS = "OAUTH_CLIENT_CREDENTIALS",
}

/**
 * Renders a set of HTTP parameters.
 *
 * @internal
 */
function renderHttpParameters(ps?: Record<string, HttpParameter>): any[] | undefined {
  if (!ps || Object.keys(ps).length === 0) return undefined;
  return Object.entries(ps).map(([name, p]) => p._render(name));
}

/**
 * A Connection construct for API Destination connections.
 *
 * @resource aws_cloudwatch_event_connection
 */
export class Connection extends AwsConstructBase implements IConnection {
  /**
   * The name of the connection.
   * @attribute
   */
  public readonly connectionName: string;
  /**
   * The ARN of the connection.
   * @attribute
   */
  public readonly connectionArn: string;
  /**
   * The ARN for the secret created for the connection.
   * @attribute
   */
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, props: ConnectionProps) {
    super(scope, id, { physicalName: props.connectionName });
    const authBind = props.authorization._bind();

    const invocationHttpParameters = (props.headerParameters || props.queryStringParameters || props.bodyParameters)
      ? {
          bodyParameters: renderHttpParameters(props.bodyParameters),
          headerParameters: renderHttpParameters(props.headerParameters),
          queryStringParameters: renderHttpParameters(props.queryStringParameters),
        }
      : undefined;

    const connectionResource = new CloudwatchEventConnection(this, "Connection", {
      authorizationType: authBind.authorizationType,
      authParameters: {
        ...authBind.authParameters,
        invocationHttpParameters: invocationHttpParameters,
      },
      description: props.description,
      name: this.physicalName,
    });

    this.connectionName = this.getResourceNameAttribute(connectionResource.ref);
    this.connectionArn = connectionResource.attrArn;
    this.connectionSecretArn = connectionResource.attrSecretArn;
  }

  public addToResourcePolicy(statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    // For simplicity this example does not implement resource policy binding.
    // You may extend this method if resource policies are supported.
    return { statementAdded: false };
  }
}

/**
 * An imported Connection.
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
  public addToResourcePolicy(_statement: iam.PolicyStatement): iam.AddToResourcePolicyResult {
    throw new Error("Cannot add a resource policy to an imported Connection.");
  }
}

/**
 * Static methods to import an existing Connection.
 */
export namespace Connection {
  /**
   * Import an existing Connection by ARN.
   *
   * @param scope Parent construct.
   * @param id Construct identifier.
   * @param connectionArn The ARN of the connection.
   * @param connectionSecretArn The ARN of the secret for the connection.
   */
  export function fromEventBusArn(scope: Construct, id: string, connectionArn: string, connectionSecretArn: string): IConnection {
    const parts = AwsStack.ofAwsConstruct(scope).parseArn(connectionArn);
    return new ImportedConnection(scope, id, {
      connectionArn,
      connectionName: parts.resourceName || "",
      connectionSecretArn,
    });
  }

  /**
   * Import an existing Connection using its attributes.
   *
   * @param scope Parent construct.
   * @param id Construct identifier.
   * @param attrs Connection attributes.
   */
  export function fromConnectionAttributes(scope: Construct, id: string, attrs: ConnectionAttributes): IConnection {
    return new ImportedConnection(scope, id, attrs);
  }
}
```
────────────────────────────
Notes:
• The abstract classes Authorization and HttpParameter use an internal “_bind()” and “_render()” method to return
  objects with the exact shape expected by CloudwatchEventConnection.AuthParametersProperty and .ParameterProperty.
• The Connection construct extends the TerraConstruct base class (AwsConstructBase) and uses AwsStack utilities
  to parse ARNs and generate unique names.
• The CloudwatchEventConnection resource is assumed to provide attribute getters “attrArn” and “attrSecretArn.”
• You may need to adjust import paths and module names according to your local TerraConstruct project structure.

This file should be saved as a .ts file and is syntactically valid and ready to be written to disk.
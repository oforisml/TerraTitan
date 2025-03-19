# Conversion Response

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:  52,639
User Prompt Tokens:   2,354
Expected Tokens:      2,724

Total Tokens:        57,717
Model Max Tokens:   100,000

```

### Response Statistics
```
Response Time: 54.19s
Actual Usage:
{
  "input_tokens": 55062,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 7213,
  "output_tokens_details": {
    "reasoning_tokens": 4928
  },
  "total_tokens": 62275
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67d989bf46dc81908ec03d22515c3b96023ecf5e6173a3a0)

## Response

Below is one valid conversion. In this example we replace the low‐level CfnConnection with the corresponding CDKTF resource (here assumed to be CloudwatchEventConnection from the AWS provider package) and extend AwsConstructBase. Note that helper methods such as getResourceNameAttribute, and AwsStack.ofAwsConstruct(…) are used similarly to our other TerraConstructs. (Adjust import paths as needed.)

───────────── Begin File ─────────────
```typescript

import { Construct } from 'constructs';
import { CloudwatchEventConnection } from '@cdktf/provider-aws'; // assumes resource aws_cloudwatch_event_connection exists
import { AwsConstructBase, AwsConstructProps, AwsStack, SecretValue } from '../aws-construct';
import * as iam from '../aws-iam';

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
   * A description for the connection.
   *
   * @default - none
   */
  readonly description?: string;

  /**
   * The authorization to be used.
   */
  readonly authorization: Authorization;

  /**
   * Additional HTTP parameters to add to the invocation body.
   *
   * @default - No additional parameters
   */
  readonly bodyParameters?: Record<string, HttpParameter>;

  /**
   * Additional HTTP parameters to add to the invocation headers.
   *
   * @default - No additional parameters
   */
  readonly headerParameters?: Record<string, HttpParameter>;

  /**
   * Additional HTTP parameters to add to the invocation query string.
   *
   * @default - No additional parameters
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

/**
 * Result type when binding an authorization.
 *
 * @internal
 */
export interface AuthorizationBindResult {
  readonly authorizationType: AuthorizationType;
  readonly authParameters: any;
}

/**
 * Base class for all API Destination authorizations.
 */
export abstract class Authorization {
  /**
   * Use API key authorization
   *
   * API key authorization requires an API key name and a key value.
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
          },
        };
      }
    }();
  }

  /**
   * Use basic authorization with username and password.
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
      throw new Error('httpMethod must be one of GET, POST, PUT');
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
   * Bind the authorization and return the configuration.
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
   * The HTTP method for the authorization request (GET, POST, or PUT).
   */
  readonly httpMethod: HttpMethod;

  /**
   * The client ID for OAuth.
   */
  readonly clientId: string;

  /**
   * The client secret for OAuth.
   */
  readonly clientSecret: SecretValue;

  /**
   * Additional HTTP parameters for the OAuth request body.
   *
   * @default - No additional parameters
   */
  readonly bodyParameters?: Record<string, HttpParameter>;

  /**
   * Additional HTTP parameters for the OAuth request header.
   *
   * @default - No additional parameters
   */
  readonly headerParameters?: Record<string, HttpParameter>;

  /**
   * Additional HTTP parameters for the OAuth request query string.
   *
   * @default - No additional parameters
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

/**
 * An additional HTTP parameter.
 */
export abstract class HttpParameter {
  /**
   * Create an HTTP parameter from a string value.
   */
  public static fromString(value: string): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return { key: name, value, isValueSecret: false };
      }
    }();
  }

  /**
   * Create an HTTP parameter from a secret value.
   */
  public static fromSecret(value: SecretValue): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return { key: name, value: value.unsafeUnwrap(), isValueSecret: true };
      }
    }();
  }

  /**
   * Render the HTTP parameter.
   *
   * @internal
   */
  public abstract _render(name: string): any;
}

/**
 * Interface for a Connection.
 */
export interface IConnection {
  /**
   * The name of the connection.
   */
  readonly connectionName: string;
  /**
   * The ARN of the connection.
   */
  readonly connectionArn: string;
  /**
   * The ARN of the secret associated with the connection.
   */
  readonly connectionSecretArn: string;
}

/**
 * Properties necessary to import a reusable Connection.
 */
export interface ConnectionAttributes {
  readonly connectionName: string;
  readonly connectionArn: string;
  readonly connectionSecretArn: string;
}

/**
 * Supported HTTP operations.
 */
export enum HttpMethod {
  POST = 'POST',
  GET = 'GET',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * Supported authorization types.
 */
export enum AuthorizationType {
  API_KEY = 'API_KEY',
  BASIC = 'BASIC',
  OAUTH_CLIENT_CREDENTIALS = 'OAUTH_CLIENT_CREDENTIALS',
}

/**
 * Convert a record of HTTP parameters into the array format required
 * by the connection resource.
 */
function renderHttpParameters(ps?: Record<string, HttpParameter>): any[] | undefined {
  if (!ps || Object.keys(ps).length === 0) {
    return undefined;
  }
  return Object.entries(ps).map(([name, p]) => p._render(name));
}

/**
 * A Terraform construct representing an EventBridge Connection.
 *
 * @resource aws_cloudwatch_event_connection
 */
export class Connection extends AwsConstructBase implements IConnection {
  public readonly connectionName: string;
  public readonly connectionArn: string;
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

    const connectionResource = new CloudwatchEventConnection(this, 'Connection', {
      authorizationType: authBind.authorizationType,
      authParameters: {
        ...authBind.authParameters,
        invocationHttpParameters: invocationHttpParameters,
      },
      description: props.description,
      name: this.physicalName,
    });

    this.connectionName = this.getResourceNameAttribute(connectionResource.ref);
    this.connectionArn = connectionResource.arn;
    this.connectionSecretArn = connectionResource.secretArn;
  }

  /**
   * Import an existing connection by its ARN.
   */
  public static fromEventBusArn(
    scope: Construct,
    id: string,
    connectionArn: string,
    connectionSecretArn: string
  ): IConnection {
    const parts = AwsStack.ofAwsConstruct(scope).parseArn(connectionArn);
    return new ImportedConnection(scope, id, {
      connectionArn: connectionArn,
      connectionName: parts.resourceName || '',
      connectionSecretArn: connectionSecretArn,
    });
  }

  /**
   * Import an existing connection using its attributes.
   */
  public static fromConnectionAttributes(
    scope: Construct,
    id: string,
    attrs: ConnectionAttributes
  ): IConnection {
    return new ImportedConnection(scope, id, attrs);
  }
}

/**
 * A construct representing an imported Connection.
 */
class ImportedConnection extends AwsConstructBase implements IConnection {
  public readonly connectionArn: string;
  public readonly connectionName: string;
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, attrs: ConnectionAttributes) {
    const arnParts = AwsStack.ofAwsConstruct(scope).parseArn(attrs.connectionArn);
    super(scope, id, {
      account: arnParts.account,
      region: arnParts.region,
    });
    this.connectionArn = attrs.connectionArn;
    this.connectionName = attrs.connectionName;
    this.connectionSecretArn = attrs.connectionSecretArn;
  }
}
```
───────────── End File ─────────────

Notes:
1. The class Connection now extends AwsConstructBase (the TerraConstruct base for AWS resources) and its props extend AwsConstructProps.
2. Instead of CfnConnection, the code instantiates CloudwatchEventConnection from the AWS provider.
3. The _bind() methods in Authorization return an object that is merged into the connection resource properties.
4. The renderHttpParameters function converts parameter objects as expected.
5. In fromEventBusArn the call to parseArn uses AwsStack.ofAwsConstruct(…) similar to our other TerraConstructs.

Adjust import paths and resource property names if needed based on your project structure and the actual names exported by your CDKTF provider.
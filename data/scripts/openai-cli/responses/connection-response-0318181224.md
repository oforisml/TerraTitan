# Conversion Response

Selected Model: [o3-mini](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:  38,065
User Prompt Tokens:   2,354
Expected Tokens:      2,724

Total Tokens:        43,143
Model Max Tokens:   100,000

```

### Response Statistics
```
Response Time: 122.21s
Actual Usage:
{
  "input_tokens": 40488,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 7300,
  "output_tokens_details": {
    "reasoning_tokens": 4736
  },
  "total_tokens": 47788
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67d95557658c819092719de395e8d2860b5d6ed0c337e9bd)

## Response

Below is one acceptable conversion. (Note that the CDKTF resource “aws_eventbridge_connection” is used to replace the AWS‑CDK’s CfnConnection. In this example we also provide a minimal “SecretValue” helper class and mimic resource‐attributes via getStringAttribute; you may need to adjust these patterns to match your project’s conventions.)

Below is the complete TypeScript source code ready to be written to disk:

---------------------------------------------------------------
```typescript
"use strict";
import { Construct } from "constructs";
import * as cdktf from "cdktf";
import { EventbridgeConnection } from "@cdktf/provider-aws/lib/eventbridge-connection";

/**
 * A simple SecretValue helper.
 * In CDKTF you may pass plain strings or use interpolation.
 */
export class SecretValue {
  constructor(private value: string) {}
  public unsafeUnwrap(): string {
    return this.value;
  }
  public static literal(value: string): SecretValue {
    return new SecretValue(value);
  }
}

/**
 * Marker interface for constructs that represent a resource.
 */
export interface IResource {}

/**
 * Connection properties for an API Destination Connection.
 */
export interface ConnectionProps {
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
   * The authorization type for the connection.
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
 * Result of binding an Authorization – the type and parameters required.
 */
export interface AuthorizationBindResult {
  /**
   * The authorization type.
   */
  readonly authorizationType: AuthorizationType;

  /**
   * The authorization parameters. Their data depends on the type.
   */
  readonly authParameters: any;
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
 * Supported Authorization types.
 */
export enum AuthorizationType {
  API_KEY = "API_KEY",
  BASIC = "BASIC",
  OAUTH_CLIENT_CREDENTIALS = "OAUTH_CLIENT_CREDENTIALS",
}

/**
 * Base class for all authorization implementations.
 */
export abstract class Authorization {
  /**
   * Use API key authorization.
   *
   * @param apiKeyName The API key name.
   * @param apiKeyValue The API key value.
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
   * Use basic authorization.
   *
   * @param username The username.
   * @param password The password.
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
   *
   * @param props OAuth authorization properties.
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
   * Bind the authorization and return the authorization properties.
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
   * The method to use for the authorization request.
   * (Must be POST, GET, or PUT.)
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
 * A HTTP parameter for OAuth or API key configuration.
 */
export abstract class HttpParameter {
  /**
   * Create an HTTP parameter from a plain string.
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
        };
      }
    }();
  }

  /**
   * Create an HTTP parameter from a secret.
   */
  public static fromSecret(value: SecretValue): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return {
          key: name,
          value: value.unsafeUnwrap(),
          isValueSecret: true,
        };
      }
    }();
  }

  /**
   * Render the parameter.
   *
   * @internal
   */
  public abstract _render(name: string): any;
}

/**
 * An interface for API Destination Connections.
 */
export interface IConnection extends IResource {
  /**
   * The connection name.
   */
  readonly connectionName: string;

  /**
   * The ARN of the connection.
   */
  readonly connectionArn: string;

  /**
   * The ARN for the secret created for the connection.
   */
  readonly connectionSecretArn: string;
}

/**
 * Attributes required to import a reusable Connection.
 */
export interface ConnectionAttributes {
  readonly connectionName: string;
  readonly connectionArn: string;
  readonly connectionSecretArn: string;
}

/**
 * Helper function to render HTTP parameters.
 */
function renderHttpParameters(
  ps?: Record<string, HttpParameter>
): any[] | undefined {
  if (!ps || Object.keys(ps).length === 0) {
    return undefined;
  }
  return Object.entries(ps).map(([name, p]) => p._render(name));
}

/**
 * Define an EventBridge Connection.
 *
 * This construct maps to the terraform resource "aws_eventbridge_connection".
 */
export class Connection extends cdktf.TerraformResource implements IConnection {
  public readonly connectionName: string;
  public readonly connectionArn: string;
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, props: ConnectionProps) {
    super(scope, id, {
      terraformResourceType: "aws_eventbridge_connection",
      terraformGeneratorMetadata: {
        providerName: "aws",
      },
    });

    // Use the provided connectionName or fall back to the construct id.
    const physicalName = props.connectionName || id;

    // Bind the authorization implementation.
    const authBind = props.authorization._bind();

    // Prepare invocation HTTP parameters if any are provided.
    const invocationHttpParameters =
      props.headerParameters ||
      props.queryStringParameters ||
      props.bodyParameters
        ? {
            bodyParameters: renderHttpParameters(props.bodyParameters),
            headerParameters: renderHttpParameters(props.headerParameters),
            queryStringParameters: renderHttpParameters(props.queryStringParameters),
          }
        : undefined;

    new EventbridgeConnection(this, "ConnectionResource", {
      name: physicalName,
      description: props.description,
      authorizationType: authBind.authorizationType,
      authParameters: {
        ...authBind.authParameters,
        invocationHttpParameters: invocationHttpParameters,
      },
    });

    // In CDKTF, computed attributes may be obtained via getStringAttribute.
    this.connectionName = this.getStringAttribute("name");
    this.connectionArn = this.getStringAttribute("arn");
    this.connectionSecretArn = this.getStringAttribute("secret_arn");
  }
}

/**
 * An imported connection resource.
 */
class ImportedConnection extends cdktf.TerraformResource implements IConnection {
  public readonly connectionName: string;
  public readonly connectionArn: string;
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, attrs: ConnectionAttributes) {
    super(scope, id, {
      terraformResourceType: "aws_eventbridge_connection",
      terraformGeneratorMetadata: {
        providerName: "aws",
      },
    });
    this.connectionArn = attrs.connectionArn;
    this.connectionName = attrs.connectionName;
    this.connectionSecretArn = attrs.connectionSecretArn;
  }
}

/**
 * Static methods to import an existing Connection.
 */
export namespace Connection {
  /**
   * Import an existing connection by ARN.
   *
   * @param scope Parent construct.
   * @param id Construct ID.
   * @param connectionArn ARN of the connection.
   * @param connectionSecretArn ARN of the secret created for the connection.
   */
  export function fromEventBusArn(
    scope: Construct,
    id: string,
    connectionArn: string,
    connectionSecretArn: string
  ): IConnection {
    // For simplicity, we do not parse the connectionArn here.
    return new ImportedConnection(scope, id, {
      connectionArn: connectionArn,
      connectionName: "", // Optionally extract from the ARN.
      connectionSecretArn: connectionSecretArn,
    });
  }

  /**
   * Import an existing connection using its attributes.
   *
   * @param scope Parent construct.
   * @param id Construct ID.
   * @param attrs Imported connection properties.
   */
  export function fromConnectionAttributes(
    scope: Construct,
    id: string,
    attrs: ConnectionAttributes
  ): IConnection {
    return new ImportedConnection(scope, id, attrs);
  }
}
```

---------------------------------------------------------------

Notes:
1. The CDKTF resource “aws_eventbridge_connection” automatically converts camelCase to snake_case.
2. The helper function renderHttpParameters produces an array of parameter objects exactly as expected by the underlying Terraform resource.
3. The SecretValue helper provided here is minimal; in your real project you may use a more robust secret management method.
4. ImportedConnection is provided so that users may import existing connections.

This file is syntactically valid TypeScript for CDKTF and is ready to be written to disk.
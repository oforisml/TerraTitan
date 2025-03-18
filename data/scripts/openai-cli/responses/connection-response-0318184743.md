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
Response Time: 38.60s
Actual Usage:
{
  "input_tokens": 40488,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 5300,
  "output_tokens_details": {
    "reasoning_tokens": 3072
  },
  "total_tokens": 45788
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67d95d60aa1481908c76e95c646a24d701af31c0291cfe06)

## Response

Below is one complete CDKTF‐based conversion. In this conversion we use the Terraform AWS provider’s EventBridge Connection resource (which is declared as “aws_eventbridge_connection”) and map our original “CfnConnection” properties onto its arguments. (Note that CDKTF’s programming model requires use of TerraformResource as the base class and that secret values must be “unwrapped” explicitly.) You may need to adjust the import paths (and possibly the SecretValue implementation) to match your project structure.

Save the following as, for example, connection.ts:

------------------------------------------------------------

```typescript
/* connection.ts */
import { Construct } from "constructs";
import { TerraformResource, TerraformMetaArguments } from "cdktf";
import { EventbridgeConnection } from "@cdktf/provider-aws";
// (Make sure your provider-version supports aws_eventbridge_connection)
// ----------------------------------------------------------------------
// Helper types for secret values.
// In a real project your SecretValue type would come from your library.
export interface SecretValue {
  unsafeUnwrap(): string;
}
export class Secret implements SecretValue {
  constructor(private value: string) {}
  unsafeUnwrap(): string {
    return this.value;
  }
}

// ----------------------------------------------------------------------
// HTTP Parameter abstraction

export abstract class HttpParameter {
  /**
   * Render the parameter value.
   * @internal
   */
  public abstract _render(name: string): any;
  public static fromString(value: string): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return {
          key: name,
          value: value,
          is_value_secret: false,
        };
      }
    }();
  }
  public static fromSecret(value: SecretValue): HttpParameter {
    return new class extends HttpParameter {
      public _render(name: string) {
        return {
          key: name,
          value: value.unsafeUnwrap(), // safe usage
          is_value_secret: true,
        };
      }
    }();
  }
}

// ----------------------------------------------------------------------
// Authorization Binding result

export interface AuthorizationBindResult {
  readonly authorizationType: AuthorizationType;
  readonly authParameters: any;
}

// ----------------------------------------------------------------------
// Supported Authorization Types (as used in the Terraform resource)
export enum AuthorizationType {
  API_KEY = "API_KEY",
  BASIC = "BASIC",
  OAUTH_CLIENT_CREDENTIALS = "OAUTH_CLIENT_CREDENTIALS",
}

// ----------------------------------------------------------------------
// Supported HTTP Methods
export enum HttpMethod {
  POST = "POST",
  GET = "GET",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

// ----------------------------------------------------------------------
// OAuth authorization properties
export interface OAuthAuthorizationProps {
  readonly authorizationEndpoint: string;
  readonly httpMethod: HttpMethod;
  readonly clientId: string;
  readonly clientSecret: SecretValue;
  readonly bodyParameters?: Record<string, HttpParameter>;
  readonly headerParameters?: Record<string, HttpParameter>;
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

// ----------------------------------------------------------------------
// Abstract Authorization. The _bind() method returns the configuration that
// will be passed to the Terraform resource.
export abstract class Authorization {
  public static apiKey(apiKeyName: string, apiKeyValue: SecretValue): Authorization {
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.API_KEY,
          authParameters: {
            api_key_auth_parameters: {
              api_key_name: apiKeyName,
              api_key_value: apiKeyValue.unsafeUnwrap(),
            },
          },
        };
      }
    }();
  }
  public static basic(username: string, password: SecretValue): Authorization {
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.BASIC,
          authParameters: {
            basic_auth_parameters: {
              username: username,
              password: password.unsafeUnwrap(),
            },
          },
        };
      }
    }();
  }
  public static oauth(props: OAuthAuthorizationProps): Authorization {
    if (![HttpMethod.POST, HttpMethod.GET, HttpMethod.PUT].includes(props.httpMethod)) {
      throw new Error("httpMethod must be one of GET, POST, PUT");
    }
    return new class extends Authorization {
      public _bind(): AuthorizationBindResult {
        return {
          authorizationType: AuthorizationType.OAUTH_CLIENT_CREDENTIALS,
          authParameters: {
            o_auth_parameters: {
              authorization_endpoint: props.authorizationEndpoint,
              client_parameters: {
                client_id: props.clientId,
                client_secret: props.clientSecret.unsafeUnwrap(),
              },
              http_method: props.httpMethod,
              o_auth_http_parameters: {
                body_parameters: renderHttpParameters(props.bodyParameters),
                header_parameters: renderHttpParameters(props.headerParameters),
                query_string_parameters: renderHttpParameters(props.queryStringParameters),
              },
            },
          },
        };
      }
    }();
  }
  public abstract _bind(): AuthorizationBindResult;
}

// ----------------------------------------------------------------------
// Connection Properties for our Connection resource
export interface ConnectionProps {
  /**
   * The connection name. If not provided one will be generated.
   */
  readonly connectionName?: string;
  /**
   * A description for the connection.
   */
  readonly description?: string;
  /**
   * The authorization to use.
   */
  readonly authorization: Authorization;
  /**
   * Additional invocation body parameters.
   */
  readonly bodyParameters?: Record<string, HttpParameter>;
  /**
   * Additional invocation header parameters.
   */
  readonly headerParameters?: Record<string, HttpParameter>;
  /**
   * Additional invocation query string parameters.
   */
  readonly queryStringParameters?: Record<string, HttpParameter>;
}

// ----------------------------------------------------------------------
// IConnection interface (for imported connections)
export interface IConnection {
  readonly connectionName: string;
  readonly connectionArn: string;
  readonly connectionSecretArn: string;
}

// ----------------------------------------------------------------------
// Attributes needed to import an existing Connection.
export interface ConnectionAttributes {
  readonly connectionName: string;
  readonly connectionArn: string;
  readonly connectionSecretArn: string;
}

// ----------------------------------------------------------------------
// Utility function to render HTTP parameters from an object.
function renderHttpParameters(ps?: Record<string, HttpParameter>): any[] | undefined {
  if (!ps || Object.keys(ps).length === 0) { return undefined; }
  return Object.entries(ps).map(([name, parameter]) => parameter._render(name));
}

// ----------------------------------------------------------------------
// Connection resource – this is the CDKTF construct that creates an EventBridge Connection.
export class Connection extends TerraformResource implements IConnection {

  public static readonly tfResourceType = "aws_eventbridge_connection";

  public readonly connectionName: string;
  public readonly connectionArn: string;
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, props: ConnectionProps) {
    // Use the provided connectionName or fallback to the id.
    const physicalName = props.connectionName ? props.connectionName : id;
    // Pass any required meta-arguments via the options.
    super(scope, id, {
      terraformResourceType: Connection.tfResourceType,
      terraformGeneratorMetadata: {
        providerName: "aws",
      },
      dependsOn: [],
      provider: undefined,
      count: undefined,
      lifecycle: {},
    });

    // Bind authorization parameters.
    const authBind = props.authorization._bind();

    // If any top-level HTTP parameters exist, create an invocation parameters block.
    const invocationHttpParameters = (props.bodyParameters || props.headerParameters || props.queryStringParameters) ? {
      body_parameters: renderHttpParameters(props.bodyParameters),
      header_parameters: renderHttpParameters(props.headerParameters),
      query_string_parameters: renderHttpParameters(props.queryStringParameters),
    } : undefined;

    // Create the connection resource
    const connectionResource = new EventbridgeConnection(this, "Resource", {
      name: physicalName,
      description: props.description,
      authorizationType: authBind.authorizationType,
      authParameters: {
        // Spread the parameters from _bind() then add the invocation HTTP parameters
        ...authBind.authParameters,
        ...(invocationHttpParameters ? { invocationHttpParameters } : {}),
      },
    });

    // Expose resource attributes
    this.connectionName = connectionResource.name;
    this.connectionArn = connectionResource.arn;
    this.connectionSecretArn = connectionResource.secretArn;
  }

  /**
   * Import an existing connection using connection attributes.
   */
  public static fromConnectionAttributes(scope: Construct, id: string, attrs: ConnectionAttributes): IConnection {
    return new ImportedConnection(scope, id, attrs);
  }

  /**
   * Import an existing connection using connection ARN and secret ARN.
   */
  public static fromConnectionArn(scope: Construct, id: string, connectionArn: string, connectionSecretArn: string): IConnection {
    // In a real implementation you might parse the ARN to get the connection name.
    // Here we simply assume the connection name is embedded in the ARN.
    const connectionName = connectionArn.split("/").pop() || "";
    return new ImportedConnection(scope, id, {
      connectionArn,
      connectionName,
      connectionSecretArn,
    });
  }
}

// ----------------------------------------------------------------------
// A helper class for imported connections.
class ImportedConnection extends TerraformResource implements IConnection {
  public readonly connectionName: string;
  public readonly connectionArn: string;
  public readonly connectionSecretArn: string;

  constructor(scope: Construct, id: string, attrs: ConnectionAttributes) {
    // When importing, no new resource is created. We pass an empty configuration.
    super(scope, id, {
      terraformResourceType: Connection.tfResourceType,
      terraformGeneratorMetadata: {
        providerName: "aws",
      },
      count: 0,
      dependsOn: [],
      provider: undefined,
      lifecycle: { preventDestroy: true },
    });
    this.connectionArn = attrs.connectionArn;
    this.connectionName = attrs.connectionName;
    this.connectionSecretArn = attrs.connectionSecretArn;
  }
}

//
// End of file
//------------------------------------------------------------
```

Explanations:

1. We define our own abstract classes Authorization and HttpParameter so that static helper functions (apiKey, basic, oauth) return an object whose _bind() method returns the appropriate object (matching Terraform property names).

2. The renderHttpParameters function converts a record of HttpParameter objects into an array of parameter blocks.

3. The Connection construct extends TerraformResource and instantiates the EventbridgeConnection resource from the AWS provider. Its properties – including name, description, authorizationType, and the proper authParameters block – are set based on the bound authorization and any provided HTTP parameter overrides.

4. Two static methods (fromConnectionAttributes and fromConnectionArn) are provided for importing an external connection.

This file should be syntactically correct with CDKTF and ready for use with your Terraform stack.
# Conversion Response

Selected Model: [o3-mini (high)](https://platform.openai.com/docs/models/o3-mini)

## Metadata

### Token Summary
```
Instruction Tokens:                   24,830
Simulated User Prompt Tokens:         15,684
Simulated Assistent Response Tokens:   7,903
New User Prompt Tokens:                4,356
Expected Tokens:                       6,217

Total Tokens:                         58,990
Model Max Tokens:                    100,000

```

### Response Statistics
```
Response Time: 49.73s
Actual Usage:
{
  "input_tokens": 52850,
  "input_tokens_details": {
    "cached_tokens": 0
  },
  "output_tokens": 6575,
  "output_tokens_details": {
    "reasoning_tokens": 5568
  },
  "total_tokens": 59425
}
```

### Links
[View in OpenAI Dashboard](https://platform.openai.com/logs/resp_67dbefb89a24819099ebbd3f1ac9cc7b05edfd7b37186671)

## Response

```typescript
import "cdktf/lib/testing/adapters/jest";
import { Template } from "../../assertions";
import { SecretValue, App } from "cdktf";
import { AwsStack } from "../../../src/aws/aws-stack";
import * as events from "../../../src/aws/events/connection";
import { HttpMethod } from "../../../src/aws/events/connection";
import { cloudwatchEventConnection } from "@cdktf/provider-aws";

describe("EventBridge Connection", () => {
  let app: App;
  let stack: AwsStack;

  beforeEach(() => {
    app = new App();
    // Create an AWS stack for testing
    stack = new AwsStack(app, "TestStack");
  });

  test("basic connection", () => {
    new events.Connection(stack, "Connection", {
      authorization: events.Authorization.basic("username", SecretValue.unsafePlainText("password")),
      connectionName: "testConnection",
      description: "ConnectionDescription",
    });

    const t = Template.synth(stack);
    t.expect.toHaveResourceWithProperties(cloudwatchEventConnection.CloudwatchEventConnection, {
      authorization_type: "BASIC",
      auth_parameters: {
        basic: {
          username: "username",
          password: "password",
        },
      },
      name: "testConnection",
      description: "ConnectionDescription",
    });
  });

  test("API key connection", () => {
    new events.Connection(stack, "Connection", {
      authorization: events.Authorization.apiKey("keyname", SecretValue.unsafePlainText("keyvalue")),
    });

    const t = Template.synth(stack);
    t.expect.toHaveResourceWithProperties(cloudwatchEventConnection.CloudwatchEventConnection, {
      authorization_type: "API_KEY",
      auth_parameters: {
        api_key: {
          key: "keyname",
          value: "keyvalue",
        },
      },
    });
  });

  test("oauth connection", () => {
    new events.Connection(stack, "Connection", {
      authorization: events.Authorization.oauth({
        authorizationEndpoint: "authorizationEndpoint",
        clientId: "clientID",
        clientSecret: SecretValue.unsafePlainText("clientSecret"),
        httpMethod: HttpMethod.GET,
        headerParameters: {
          oAuthHeaderKey: events.HttpParameter.fromString("oAuthHeaderValue"),
        },
      }),
      headerParameters: {
        invocationHeaderKey: events.HttpParameter.fromString("invocationHeaderValue"),
      },
      connectionName: "testConnection",
      description: "ConnectionDescription",
    });

    const t = Template.synth(stack);
    t.expect.toHaveResourceWithProperties(cloudwatchEventConnection.CloudwatchEventConnection, {
      authorization_type: "OAUTH_CLIENT_CREDENTIALS",
      auth_parameters: {
        oauth: {
          authorization_endpoint: "authorizationEndpoint",
          http_method: "GET",
          client_parameters: {
            client_id: "clientID",
            client_secret: "clientSecret",
          },
          oauth_http_parameters: {
            header: [
              {
                key: "oAuthHeaderKey",
                value: "oAuthHeaderValue",
                is_value_secret: false,
              },
            ],
          },
        },
        invocation_http_parameters: {
          header: [
            {
              key: "invocationHeaderKey",
              value: "invocationHeaderValue",
              is_value_secret: false,
            },
          ],
        },
      },
      name: "testConnection",
      description: "ConnectionDescription",
    });
  });

  test("Additional plaintext headers", () => {
    new events.Connection(stack, "Connection", {
      authorization: events.Authorization.apiKey("keyname", SecretValue.unsafePlainText("keyvalue")),
      headerParameters: {
        "content-type": events.HttpParameter.fromString("application/json"),
      },
    });

    const t = Template.synth(stack);
    t.expect.toHaveResourceWithProperties(cloudwatchEventConnection.CloudwatchEventConnection, {
      auth_parameters: {
        invocation_http_parameters: {
          header: [
            {
              key: "content-type",
              value: "application/json",
              is_value_secret: false,
            },
          ],
        },
      },
    });
  });

  test("Additional secret headers", () => {
    new events.Connection(stack, "Connection", {
      authorization: events.Authorization.apiKey("keyname", SecretValue.unsafePlainText("keyvalue")),
      headerParameters: {
        "client-secret": events.HttpParameter.fromSecret(SecretValue.unsafePlainText("apiSecret")),
      },
    });

    const t = Template.synth(stack);
    t.expect.toHaveResourceWithProperties(cloudwatchEventConnection.CloudwatchEventConnection, {
      auth_parameters: {
        invocation_http_parameters: {
          header: [
            {
              key: "client-secret",
              value: "apiSecret",
              is_value_secret: true,
            },
          ],
        },
      },
    });
  });
});
```
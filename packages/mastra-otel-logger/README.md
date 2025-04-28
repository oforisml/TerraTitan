# Mastra OTEL Transport Logger

Stream Mastra (Pino-style) application logs straight to any OpenTelemetry-compatible backend—SigNoz, Honeycomb, Tempo, etc.—**without** running a separate collector or creating a second `LoggerProvider`.
The transport plugs into Mastra’s logging façade and emits each record through the **globally configured** `LoggerProvider` you may bootstrap with the OpenTelemetry Node SDK.

---

## Features

- 🔄 **Zero-duplication** – re-uses the `LoggerProvider` initialised in your existing `instrumentation.ts` (traces/metrics + logs share the same resource, exporter and batch options).
- ⚖️ **Configurable severity mapping** from Mastra/Pino levels (or numeric Pino codes) to OTEL `SeverityNumber`.
- 🌳 **Structured attributes** – every custom field you pass to `logger.info()` becomes a searchable attribute in the backend.
- 🔌 **Composable** – combine with file, Upstash, or PrettyConsole transports in the same Mastra logger.
- 🪶 **Lightweight** – no runtime dependency on `otlp-logger`; just `@opentelemetry/api-logs`.

---

## Installation

```bash
pnpm add @mastra/core @mastra/loggers-otel        # Mastra core + the transport
pnpm add @opentelemetry/api-logs                  # OTEL logs API (peer dep)
```

---

## Quick-start

### 1 – Bootstrap OTEL (once per process)

```ts
// instrumentation.ts
import {
  NodeSDK,
  getNodeAutoInstrumentations,
  OTLPHttpExporter,
  Resource,
  ATTR_SERVICE_NAME,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@mastra/core/telemetry/otel-vendor';
// Make sure correct version of sdk-logs && exporter-logs-otlp-http are used
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'; // Base endpoint

const logExporter = new OTLPLogExporter({
  url: `${otlpEndpoint}/v1/logs`, // Append specific path
});

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'checkout-service',
  }),
  sampler: new ParentBasedSampler({
    root: new TraceIdRatioBasedSampler(1.0),
  }),
  traceExporter: new OTLPHttpExporter({
    url:  `${otlpEndpoint}/v1/traces`,
  }),
  // Processor+Exporter for logs
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: `${otlpEndpoint}/v1/logs`,
    }),
  ),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

> The SDK registers *one* global `LoggerProvider` which the transport will reuse.

---

### 2 – Create a Mastra logger with the OTEL transport

```ts
// logger.ts
import { createLogger, LogLevel } from '@mastra/core/logger';
import { OTelTransport } from '@mastra/loggers-otel';

export const logger = createLogger({
  name: 'checkout-service',
  level: LogLevel.INFO,
  transports: {
    otel: new OTelTransport({
      // optional overrides
      loggerName: 'mastra-otel',
      severityNumberMap: { debug: 5 }, // custom mapping
    }),
  },
});
```

### 3 – Emit logs

```ts
logger.info('order accepted', {
  orderId: 42,
  customerId: 'ACME-123',
  runId: 'run_abc',      // searchable attribute
  type:   'WORKFLOW',    // Mastra RegisteredLogger dimension
});
```

Open SigNoz ➜ Logs → filter by `service.name = checkout-service`.

---

## API

### `new OTelTransport(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `severityNumberMap` | `Record\<string\|number, SeverityNumber\>` | see table below | Overrides Mastra/Pino → OTEL severity mapping. |
| `loggerName` | `string` | `"mastra-logger"` | Name reported to OTEL back-end (`InstrumentationScope`). |
| `loggerVersion` | `string` | `undefined` | Optional version tag. |

#### Default severity map

| Mastra / Pino | OTEL `SeverityNumber` |
|---------------|-----------------------|
| `debug` / 20  | `DEBUG` (5) |
| `info`  / 30  | `INFO` (9) |
| `warn`  / 40  | `WARN` (13) |
| `error` / 50  | `ERROR` (17) |
| `fatal` / 60  | `FATAL` (21) |
| `trace` / 10  | `TRACE` (1) |

---

## Environment variables cheat-sheet

| Variable | Purpose | Typical value |
|----------|---------|---------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Traces endpoint (set in NodeSDK) | `http://otel-collector:4318/v1/traces` |
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Logs endpoint (if different) | `http://otel-collector:4318/v1/logs` |
| `OTEL_RESOURCE_ATTRIBUTES` | Default resource tags | `service.name=checkout-service,service.version=1.2.3` |
| `SIGNOZ_TOKEN` (custom header) | SigNoz Cloud ingest key | *copy from SigNoz UI* |

---

## Troubleshooting

| Symptom | Checklist |
|---------|-----------|
| **No logs in backend** | • Did `instrumentation.ts` run *before* any logs?<br/>  • Correct `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT`?<br/>  • Firewall between app and collector? |
| **400 / 415 errors** | HTTP/JSON uses port 4318; gRPC uses 4317. Match exporter/receiver. |
| **Duplicate resources** | Ensure you removed any helper like `otlp-logger` that installs its own `LoggerProvider`. |
| **Attributes missing** | Verify you pass structured fields as the *first argument object* in Mastra (`logger.info({...}, msg)` pattern). |

---

## Composable with other transports

```ts
import { UpstashTransport } from '@mastra/loggers-upstash';

const logger = createLogger({
  transports: {
    otel: new OTelTransport(),
    redis: new UpstashTransport({
      upstashUrl: process.env.UPSTASH_REDIS_URL!,
      upstashToken: process.env.UPSTASH_REDIS_TOKEN!,
    }),
  },
});
```

Pretty-prints to console, ships to OTEL, **and** keeps a rolling Redis buffer—no code changes elsewhere.

---

## License

Apache-2.0

/*instrumentation.ts*/
import {
  NodeSDK,
  getNodeAutoInstrumentations,
  ATTR_SERVICE_NAME,
  Resource,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  OTLPHttpExporter,
} from '@mastra/core/telemetry/otel-vendor';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'; // Base endpoint
const rootSampler = new TraceIdRatioBasedSampler(1.0);
const sampler = new ParentBasedSampler({ root: rootSampler });
const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'default-service',
  }),
  sampler,
  traceExporter: new OTLPHttpExporter({
    url: `${otlpEndpoint}/v1/traces`,
  }),
  logRecordProcessor: new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: `${otlpEndpoint}/v1/logs`,
    }),
  ), // Processor+Exporter for logs
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown().catch(() => {
    // do nothing
  });
});

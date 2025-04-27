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

const rootSampler = new TraceIdRatioBasedSampler(1.0);
const sampler = new ParentBasedSampler({ root: rootSampler });
const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'default-service',
  }),
  sampler,
  traceExporter: new OTLPHttpExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown().catch(() => {
    // do nothing
  });
});

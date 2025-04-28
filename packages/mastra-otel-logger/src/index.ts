// Mastra OTEL Transport – streams Mastra log records to the **existing**
// OpenTelemetry LoggerProvider configured in `instrumentation.ts` (NodeSDK).
//
// Key design change after review:
// --------------------------------------------------------------
// We **do not** use `otlp-logger` here.  That helper spins up a second
// LoggerProvider and calls `logs.setGlobalLoggerProvider()`, which would race
// with the provider already installed by NodeSDK and lead to split resources
// or dropped logs.  Instead, we emit via the singleton acquired from
// `@opentelemetry/api-logs`.

import { LoggerTransport, BaseLogMessage, LogLevel } from '@mastra/core/logger';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

/**
 * Map Mastra / pino levels to OpenTelemetry severity numbers.
 * Can be overridden in the constructor.
 */
const DEFAULT_SEVERITY_MAP: Record<string | number, SeverityNumber> = {
  [LogLevel.DEBUG]: SeverityNumber.DEBUG,
  [LogLevel.INFO]: SeverityNumber.INFO,
  [LogLevel.WARN]: SeverityNumber.WARN,
  [LogLevel.ERROR]: SeverityNumber.ERROR,
  10: SeverityNumber.TRACE,
  20: SeverityNumber.DEBUG,
  30: SeverityNumber.INFO,
  40: SeverityNumber.WARN,
  50: SeverityNumber.ERROR,
  60: SeverityNumber.FATAL,
};

// Standard Pino level labels
const PINO_LEVEL_LABELS: { [key: number]: string } = {
  10: 'trace',
  20: 'debug',
  30: 'info',
  40: 'warn',
  50: 'error',
  60: 'fatal',
};

export interface OtelTransportOptions {
  /** Override default mapping of Mastra/pino → OTEL severities */
  severityNumberMap?: Record<string | number, SeverityNumber>;
  /** Optional logger name; defaults to "mastra-logger" */
  loggerName?: string;
  /** Optional logger version; propagated as resource attribute */
  loggerVersion?: string;
}

export class OtelTransport extends LoggerTransport {
  private readonly otelLogger = logs.getLogger(this.constructor.name, undefined /* version populated later */);
  private readonly severityMap: Record<string | number, SeverityNumber>;

  constructor(opts: OtelTransportOptions = {}) {
    super({ objectMode: true }); // Ensure we handle objects
    this.severityMap = { ...DEFAULT_SEVERITY_MAP, ...opts.severityNumberMap };
    // Update logger metadata if a custom name/version was passed
    if (opts.loggerName || opts.loggerVersion) {
      // Note: getLogger() caches by name+version, so we fetch again.
      this.otelLogger = logs.getLogger(opts.loggerName ?? 'mastra-logger', opts.loggerVersion);
    }
  }

  _transform(chunk: string | object, _enc: BufferEncoding, cb: (err?: Error | null, data?: any) => void) {
    try {
      const log: Record<string, any> = typeof chunk === 'string' ? JSON.parse(chunk) : chunk;

      const { time, msg, level, ...attrs } = log;
      const severityNumber = this.severityMap[level] ?? SeverityNumber.UNSPECIFIED;
      const severityText =
        typeof level === 'string' ? level.toUpperCase() : (PINO_LEVEL_LABELS[level] ?? 'UNSPECIFIED');
      const body = String(msg || ''); // Ensure body is a string

      this.otelLogger.emit({
        timestamp: time ?? Date.now(),
        body,
        severityNumber,
        severityText,
        attributes: attrs,
      });

      // Pass downstream so pretty printing & other transports still see it
      cb(null, chunk);
    } catch (err) {
      // Decide if you want to drop the log or pass the error
      cb(err as Error);
    }
  }

  // Shutdown hook – NodeSDK already flushes exporters in its own `shutdown()`
  async _destroy(err: Error | null, cb: (err?: Error | null) => void) {
    // No explicit shutdown required: LoggerProvider is owned by NodeSDK.
    cb(err);
  }

  // Reading back logs from remote backend is out‑of‑scope for this transport.
  async getLogs(): Promise<BaseLogMessage[]> {
    return [];
  }
  async getLogsByRunId({ runId }: { runId: string }): Promise<BaseLogMessage[]> {
    return [];
  }
}

export default OtelTransport;

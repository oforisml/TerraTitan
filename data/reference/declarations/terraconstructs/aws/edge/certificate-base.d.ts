import { ICertificate, CertificateOutputs } from "./certificate";
import { AwsConstructBase } from "../aws-construct";
import * as cloudwatch from "../cloudwatch";
/**
 * Shared implementation details of ICertificate implementations.
 *
 * @internal
 */
export declare abstract class CertificateBase extends AwsConstructBase implements ICertificate {
    abstract readonly certificateArn: string;
    abstract readonly domainName: string;
    abstract readonly certificateOutputs: CertificateOutputs;
    /**
     * If the certificate is provisionned in a different region than the
     * containing stack, this should be the region in which the certificate lives
     * so we can correctly create `Metric` instances.
     */
    protected readonly region?: string;
    metricDaysToExpiry(props?: cloudwatch.MetricOptions): cloudwatch.Metric;
}

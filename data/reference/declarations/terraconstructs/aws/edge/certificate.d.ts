import { acmCertificate } from "@cdktf/provider-aws";
import { Construct } from "constructs";
import { IDnsZone } from ".";
import { CertificateBase } from "./certificate-base";
import { IAwsConstruct, AwsConstructProps } from "../aws-construct";
import * as cloudwatch from "../cloudwatch";
export interface CertificateOutputs {
    /**
     * Status of the certificate.
     */
    readonly status: string;
    /**
     * The ARN of the certificate.
     */
    readonly arn: string;
    /**
     * Set of domain validation objects which can be used to complete certificate validation.
     * Can have more than one element, e.g., if SANs are defined.
     *
     * Only set if DNS-validation was used.
     */
    readonly domainValidationOptions?: acmCertificate.AcmCertificateDomainValidationOptionsList;
}
export interface ICertificate extends IAwsConstruct {
    /** Strongly typed outputs */
    readonly certificateOutputs: CertificateOutputs;
    /**
     * Domain name of the certificate.
     */
    readonly domainName: string;
    /**
     * The ARN of the certificate.
     */
    readonly certificateArn: string;
    /**
     * Return the DaysToExpiry metric for this AWS Certificate Manager
     * Certificate. By default, this is the minimum value over 1 day.
     *
     * This metric is no longer emitted once the certificate has effectively
     * expired, so alarms configured on this metric should probably treat missing
     * data as "breaching".
     */
    metricDaysToExpiry(props?: cloudwatch.MetricOptions): cloudwatch.Metric;
}
export interface PublicCertificateProps extends AwsConstructProps {
    /**
     * Domain name of the certificate.
     *
     * Changing this property will force a new resource.
     */
    readonly domainName: string;
    /**
     * SANs for the domain.
     *
     * Changing this property will force a new resource.
     */
    readonly subjectAlternativeNames?: string[];
    /**
     * Specifies the algorithm of the public and private key pair that your Amazon issued
     * certificate uses to encrypt data.
     * See [ACM Certificate characteristics][acm-certificate-algorithms] for more details.
     *
     * @default RSA_2048
     *
     * [acm-certificate-algorithms]: https://docs.aws.amazon.com/acm/latest/userguide/acm-certificate-characteristics.html#algorithms
     */
    readonly keyAlgorithm?: string;
    /**
     * Validation configuration for the certificate.
     */
    readonly validation?: CertificateValidationOption;
}
export interface CertificateValidationOption {
    /**
     * How to validate this certificate
     *
     * To validate ownership by adding appropriate DNS records
     *
     * @default ValidationMethod.EMAIL
     *
     * @see https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html
     */
    readonly method: ValidationMethod;
    /**
     * Hosted zone to use for DNS validation
     *
     * @default - use email validation
     */
    readonly hostedZone?: IDnsZone;
    /**
     * A map of hosted zones to use for DNS validation
     *
     * @default - use `hostedZone`
     */
    readonly hostedZones?: {
        [domainName: string]: IDnsZone;
    };
    /**
     * Validation domains to use for email validation
     *
     * @default - Apex domain
     */
    readonly validationDomains?: {
        [domainName: string]: string;
    };
}
/**
 * Amazon issued certificate
 */
export declare class PublicCertificate extends CertificateBase implements ICertificate {
    /**
     * Import a certificate
     */
    static fromDomainName(scope: Construct, id: string, domain: string): ICertificate;
    /**
     * Import a certificate from ARN
     *
     * Terraform provider aws does not support importing certificates by ARN
     */
    static fromCertificateArn(scope: Construct, id: string, certificateArn: string): ICertificate;
    resource: acmCertificate.AcmCertificate;
    private readonly _outputs;
    get certificateOutputs(): CertificateOutputs;
    get outputs(): Record<string, any>;
    private readonly _domainName;
    get domainName(): string;
    private readonly _certificateArn;
    get certificateArn(): string;
    constructor(scope: Construct, id: string, props: PublicCertificateProps);
}
/**
 * Method used to assert ownership of the domain
 */
export declare enum ValidationMethod {
    /**
     * Send email to a number of email addresses associated with the domain
     *
     * IMPORTANT: if you are creating a certificate as part of your stack, the stack
     * will not complete creating until you read and follow the instructions in the
     * email that you will receive.
     *
     * ACM will send validation emails to the following addresses:
     *
     *  admin@domain.com
     *  administrator@domain.com
     *  hostmaster@domain.com
     *  postmaster@domain.com
     *  webmaster@domain.com
     *
     * For every domain that you register.
     *
     * @see https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-email.html
     */
    EMAIL = "EMAIL",
    /**
     * Validate ownership by adding appropriate DNS records
     *
     * IMPORTANT: If `hostedZone` is not specified, DNS records must be added
     * manually and the stack will not complete creating until the records are
     * added.
     *
     * @see https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-validate-dns.html
     */
    DNS = "DNS"
}

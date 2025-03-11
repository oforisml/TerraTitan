import { provider } from "@cdktf/provider-aws";
import { ResourceTerraformIterator } from "cdktf";
import { Construct, IConstruct } from "constructs";
import { ArnComponents, ArnFormat } from "./arn";
import { AwsProviderConfig } from "./provider-config.generated";
import { StackBaseProps, StackBase, IStack } from "../stack-base";
export interface AwsStackProps extends StackBaseProps {
    /**
     * The AWS Provider configuration (without the alias field)
     */
    readonly providerConfig: AwsProviderConfig;
}
export interface IAwsStack extends IStack {
    /**
     * The AWS Region for the TerraConstruct
     */
    readonly region: string;
    /**
     * The AWS Account for the TerraConstruct
     */
    readonly account: string;
    /**
     * The AWS Partition for the TerraConstruct
     */
    readonly partition: string;
    /**
     * The service Principal Id for a specific service
     *
     * @param serviceName The service name to get the service principal ID for
     * @param region The region to get the service principal ID for
     */
    servicePrincipalName(serviceName: string, region?: string): string;
}
/**
 * A Terraform stack constrained to a single AWS Account/Region to simulate CFN behavior.
 */
export declare class AwsStack extends StackBase implements IAwsStack {
    /**
     * Return whether the given object is a Stack.
     *
     * attribute detection since as 'instanceof' potentially fails across Library releases.
     */
    static isAwsStack(x: any): x is AwsStack;
    /**
     * Looks up the first stack scope in which `construct` is defined. Fails if there is no stack up the tree or the stack is not an AwsStack.
     * @param construct The construct to start the search from.
     */
    static ofAwsConstruct(construct: IConstruct): AwsStack;
    private readonly lookup;
    private regionalAwsProviders;
    /**
     * Cache these tokens for reliable comparisons.
     *
     * Every call for the same Token will produce a new unique string, no
     * attempt is made to deduplicate. Token objects should cache the
     * value themselves, if required.
     *
     * dataSource.getSTringattribute -> Token.asString -> tokenMap.registerString
     * ref:
     * - https://github.com/hashicorp/terraform-cdk/blob/v0.20.10/packages/cdktf/lib/terraform-data-source.ts#L68
     * - https://github.com/hashicorp/terraform-cdk/blob/v0.20.10/packages/cdktf/lib/tokens/private/token-map.ts#L50-L66
     */
    private _accountIdToken;
    private _paritionToken;
    private _urlSuffixToken;
    constructor(scope: Construct, id: string, props: AwsStackProps);
    get provider(): provider.AwsProvider;
    /**
     * Get the Region of the AWS Stack
     */
    get region(): string;
    private get dataAwsCallerIdentity();
    private get dataAwsAvailabilityZones();
    private get dataAwsPartition();
    private getRegionalAwsProvider;
    /**
     * Get the Account of the AWS Stack
     */
    get account(): string;
    /**
     * Get the Partition of the AWS Stack
     */
    get partition(): string;
    /**
     * Base DNS domain name for the current partition (e.g., amazonaws.com in AWS Commercial, amazonaws.com.cn in AWS China).
     */
    get urlSuffix(): string;
    /**
     * Return the service principal name based on the region it's used in.
     *
     * Some service principal names used to be different for different partitions,
     * and some were not.
     *
     * These days all service principal names are standardized, and they are all
     * of the form `<servicename>.amazonaws.com`.
     *
     * To avoid breaking changes, handling is provided for services added with the formats below,
     * however, no additional handling will be added for new regions or partitions.
     *   - s3
     *   - s3.amazonaws.com
     *   - s3.amazonaws.com.cn
     *   - s3.c2s.ic.gov
     *   - s3.sc2s.sgov.gov
     *
     * @param service The service name to get the service principal ID for
     * @param region The region to get the service principal ID for
     */
    servicePrincipalName(service: string, region?: string): string;
    /**
     * Creates an ARN from components.
     *
     * If `partition`, `region` or `account` are not specified, the stack's
     * partition, region and account will be used.
     *
     * If any component is the empty string, an empty string will be inserted
     * into the generated ARN at the location that component corresponds to.
     *
     * The ARN will be formatted as follows:
     *
     *   arn:{partition}:{service}:{region}:{account}:{resource}{sep}{resource-name}
     *
     * The required ARN pieces that are omitted will be taken from the stack that
     * the 'scope' is attached to. If all ARN pieces are supplied, the supplied scope
     * can be 'undefined'.
     */
    formatArn(components: ArnComponents): string;
    /**
     * Given an ARN, parses it and returns components.
     *
     * IF THE ARN IS A CONCRETE STRING...
     *
     * ...it will be parsed and validated. The separator (`sep`) will be set to '/'
     * if the 6th component includes a '/', in which case, `resource` will be set
     * to the value before the '/' and `resourceName` will be the rest. In case
     * there is no '/', `resource` will be set to the 6th components and
     * `resourceName` will be set to the rest of the string.
     *
     * IF THE ARN IS A TOKEN...
     *
     * ...it cannot be validated, since we don't have the actual value yet at the
     * time of this function call. You will have to supply `sepIfToken` and
     * whether or not ARNs of the expected format usually have resource names
     * in order to parse it properly. The resulting `ArnComponents` object will
     * contain tokens for the subexpressions of the ARN, not string literals.
     *
     * If the resource name could possibly contain the separator char, the actual
     * resource name cannot be properly parsed. This only occurs if the separator
     * char is '/', and happens for example for S3 object ARNs, IAM Role ARNs,
     * IAM OIDC Provider ARNs, etc. To properly extract the resource name from a
     * Tokenized ARN, you must know the resource type and call
     * `Arn.extractResourceName`.
     *
     * @param arn The ARN string to parse
     * @param sepIfToken The separator used to separate resource from resourceName
     * @param hasName Whether there is a name component in the ARN at all. For
     * example, SNS Topics ARNs have the 'resource' component contain the topic
     * name, and no 'resourceName' component.
     *
     * @returns an ArnComponents object which allows access to the various
     * components of the ARN.
     *
     * @returns an ArnComponents object which allows access to the various
     *      components of the ARN.
     *
     * @deprecated use splitArn instead
     */
    parseArn(arn: string, sepIfToken?: string, hasName?: boolean): ArnComponents;
    /**
     * Splits the provided ARN into its components.
     * Works both if 'arn' is a string like 'arn:aws:s3:::bucket',
     * and a Token representing a dynamic CloudFormation expression
     * (in which case the returned components will also be dynamic CloudFormation expressions,
     * encoded as Tokens).
     *
     * @param arn the ARN to split into its components
     * @param arnFormat the expected format of 'arn' - depends on what format the service 'arn' represents uses
     */
    splitArn(arn: string, arnFormat: ArnFormat): ArnComponents;
    /**
     * Returns iterator for all AZs that are available in the AWS environment
     * (account/region) associated with this stack (default or aliased provider).
     *
     * this will return a cdktf iterator
     *
     * https://developer.hashicorp.com/terraform/cdktf/concepts/iterators#define-iterators
     *
     * To specify a different strategy for selecting availability zones override this method.
     */
    get availabilityZoneIterator(): ResourceTerraformIterator;
    /**
     * Returns a List of Tokens for AZ names available in the stack's
     * AWS environment (account/region).
     *
     * The list length is `maxCount` which defaults to 2.
     *
     * @param maxCount the maximum number of AZs to return
     */
    availabilityZones(maxCount?: number): string[];
}

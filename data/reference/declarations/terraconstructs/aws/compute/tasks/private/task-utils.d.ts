import { Construct } from "constructs";
import { IntegrationPattern } from "../../";
/**
 * Verifies that a validation pattern is supported for a service integration
 *
 */
export declare function validatePatternSupported(integrationPattern: IntegrationPattern, supportedPatterns: IntegrationPattern[]): void;
export declare function integrationResourceArn(scope: Construct, service: string, api: string, integrationPattern?: IntegrationPattern): string;

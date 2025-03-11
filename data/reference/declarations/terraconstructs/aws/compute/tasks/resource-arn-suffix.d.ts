import { Construct } from "constructs";
import * as sfn from "../";
export declare function getResourceArn(scope: Construct, service: string, api: string, integrationPattern: sfn.ServiceIntegrationPattern): string;

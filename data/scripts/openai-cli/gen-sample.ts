import { generateSampleFromCdk, scanSampleDirectory } from "./requests";

async function main() {
  const { service: awsService, resource } = await generateSampleFromCdk({
    sourceFileUrl:
      "https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-sqs/lib/queue.ts",
    testFileUrl:
      "https://github.com/aws/aws-cdk/blob/v2.185.0/packages/aws-cdk-lib/aws-sqs/test/sqs.test.ts",
  });

  console.log(`running scanSampleDirectory for ${awsService} - ${resource}`);
  const configs = scanSampleDirectory({
    awsService,
    resource,
    // referenceResources: ["group", "policy"],
  });
  console.log("Unit Test Config:", configs.unitRequest);
  console.log("Source Code Config:", configs.sourceRequest);
}

main().catch(console.error);

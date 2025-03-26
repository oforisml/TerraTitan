import { scanSampleDirectory } from "./requests";

const configs = scanSampleDirectory({
  awsService: "sqs", // "iam",
  resource: "queue", // "user",
  // referenceResources: ["group", "policy"],
});

console.log("Unit Test Config:", configs.unitRequest);
console.log("Source Code Config:", configs.sourceRequest);

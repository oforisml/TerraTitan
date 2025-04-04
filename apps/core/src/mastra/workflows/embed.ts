import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { openai } from '@ai-sdk/openai';
import { EmbeddingModelV1Embedding } from '@ai-sdk/provider';
// upstash - Set up with pay as you go:
// pricing https://upstash.com/pricing/vector
import { UpstashVector } from '@mastra/upstash';
import { embedMany } from 'ai';
import * as reflect from 'jsii-reflect';
import { TiktokenModel } from 'tiktoken';
import { hasPropsParam } from '../util/type-system/index.js';
import { schemaForTypeReference } from '../util/type-system/jsii2schema.js';
import { gitRoot } from './../util/helpers.js';
import { TokenCounter } from '../util/tiktoken.js';

import dotenv from 'dotenv';
dotenv.config();

// OpenAI's limit for 'text-embedding-3-small' / 'text-embedding-3-large'
const maxTokens = 8191;

// Supported index names for TerraTitan are
// - 'provider-aws-resources-small'
//   or
// - 'provider-aws-resources-large'
const indexName = 'provider-aws-resources-small';

let dimensions: number;
let upstashUrl: string;
let upstashToken: string | undefined;
let embeddingModel: TiktokenModel;
if (indexName === 'provider-aws-resources-small') {
  // dimensions - ref https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-providers--models
  // By default, the length of the embedding vector is 1536 for 'text-embedding-3-small' or 3072 for 'text-embedding-3-large'
  dimensions = 1536;
  // mastra has built-in support for cohere and openai,
  // may reconsider later based on:
  // https://huggingface.co/spaces/mteb/leaderboard
  embeddingModel = 'text-embedding-3-small';
  upstashUrl = 'https://deep-molly-68135-us1-vector.upstash.io';
  upstashToken = process.env.UPSTASH_TOKEN_SMALL;
} else {
  dimensions = 3072;
  embeddingModel = 'text-embedding-3-large';
  upstashUrl = 'https://pretty-marmot-55613-us1-vector.upstash.io';
  upstashToken = process.env.UPSTASH_TOKEN_LARGE;
}

if (!upstashToken) {
  throw new Error(`Missing UPSTASH_TOKEN_xxx environment variable for ${indexName}`);
}

// create index specific Store
const store = new UpstashVector({
  url: upstashUrl,
  token: upstashToken,
});

let parsedResources: ParsedResource[] = [];

// if output file exists, load it instead of rebuilding it
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const outputFile = path.join(outputDir, 'aws-resources.json');
if (!fs.existsSync(outputFile)) {
  const counter = new TokenCounter(embeddingModel);
  // Load the cdktf/provider-aws assembly via jsii-reflect:
  const require = createRequire(import.meta.url);
  const ts = new reflect.TypeSystem();
  // (must load full dependency tree)
  const assemblies = ['constructs', 'cdktf', '@cdktf/provider-aws'];
  await Promise.all(
    assemblies.map(assembly => {
      const assemblyPath = require.resolve(`${assembly}/.jsii`);
      return ts.load(assemblyPath);
    }),
  );

  // find L1 terraform resources (which extend tfResourceBase)
  const tfResourceBase = ts.findClass('cdktf.TerraformResource');
  const tfResources = ts.classes.filter(c => c.extends(tfResourceBase));
  // extract constructor (initializer) and the constructor props
  const awsResources = [...tfResources.map(c => unpackTopLevel(c, 2))].filter((c): c is ClassAndProps => !!c);

  console.log('Found ' + awsResources.length + ' AWS resources');
  const tsAwsDocs = path.join(gitRoot, 'data', 'reference', 'docs', 'typescript', 'provider-aws');
  for (const resource of awsResources) {
    if (!resource.class.fqn.startsWith('@cdktf/provider-aws.')) {
      console.log('Skipping resource ' + resource.class.fqn);
      continue;
    }
    const fqn = resource.class.fqn;
    const name = resource.class.name;
    const namespace = resource.class.namespace;
    const docsSummary = resource.class.docs?.summary || '';
    let markdownDocs: string | undefined;
    let docDescription: string | undefined;
    let argumentsSection: string | undefined;
    let docFilePath: string | undefined;
    let subcategory: string | undefined;
    let pageTitle: string | undefined;
    let metaDescription: string | undefined;

    // extract {@link ...} value
    const linkRegex = /{@link\s+([^\s}]+)(?:\s+[^}]+)?}/;
    const match = docsSummary.match(linkRegex);
    const docUrl = match ? match[1] : undefined;

    // Parse the URL to extract the path
    let resourceType: string | undefined;
    if (docUrl) {
      try {
        const parsedUrl = new URL(docUrl);
        // Remove the leading slash from pathname
        const docPath = parsedUrl.pathname.startsWith('/') ? parsedUrl.pathname.substring(1) : parsedUrl.pathname;

        // Split the path and pop the last part (e.g., "ami")
        let resourceName = docPath.split('/').pop();
        // some resourceNames are mapped, i.e. alb -> lb, alb_listener -> lb_listener
        if (resourceName && resourceName.startsWith('alb')) {
          resourceName = resourceName.replace('alb', 'lb');
        }
        docFilePath = path.join(tsAwsDocs, 'r', `${resourceName}.html.markdown`);
        try {
          markdownDocs = fs.readFileSync(docFilePath, 'utf-8');

          // Find the frontmatter section between --- markers
          const frontmatterRegex = /---\s*\n([\s\S]*?)\n---/;
          const frontmatterMatch = markdownDocs.match(frontmatterRegex);

          if (frontmatterMatch && frontmatterMatch[1]) {
            const frontmatter = frontmatterMatch[1];

            // Extract subcategory
            const subcategoryMatch = frontmatter.match(/subcategory:\s*"([^"]+)"/);
            if (subcategoryMatch && subcategoryMatch[1]) {
              subcategory = subcategoryMatch[1];
            }

            // Extract page_title
            const pageTitleMatch = frontmatter.match(/page_title:\s*"([^"]+)"/);
            if (pageTitleMatch && pageTitleMatch[1]) {
              pageTitle = pageTitleMatch[1];
            }

            // Extract description (may be multi-line with |- syntax)
            const descriptionMatch = frontmatter.match(/description:\s*\|-\s*\n\s*(.*?)(\n\s*\w|$)/);
            if (descriptionMatch && descriptionMatch[1]) {
              metaDescription = descriptionMatch[1].trim();
            }
          }

          // Extract content between "# Resource:" and the next heading
          const resourceRegex = /# Resource:.*?\n\n([\s\S]*?)(?=\n## |$)/;
          const match = markdownDocs.match(resourceRegex);

          if (match && match[1]) {
            docDescription = match[1].trim();
          }

          // Extract argument reference section
          const argumentsRegex = /## Argument Reference\s*\n\n([\s\S]*?)(?=\n## |$)/;
          const argumentsMatch = markdownDocs.match(argumentsRegex);
          if (argumentsMatch && argumentsMatch[1]) {
            argumentsSection = argumentsMatch[1].trim();
          }
        } catch (fileError) {
          console.warn(`Failed to read documentation file for ${resourceType}: ${fileError}`);
        }
      } catch (error) {
        console.warn(`Failed to parse URL ${docUrl}: ${error}`);
      }
    }
    const sourceFile = resource.class.locationInModule?.filename || '';

    // Consider adding more fields or structuring differently if needed
    const textToEmbed = `
      Subcategory: ${subcategory}
      FQN: ${fqn}
      Name: ${name}
      Description: ${docDescription}
      Arguments: ${argumentsSection}
    `.trim();
    const [textToEmbedCount = 0] = counter.count(textToEmbed);

    // warn if text to embed exceeds maxTokens
    if (textToEmbedCount > maxTokens) {
      console.warn(`Text to embed for ${fqn} exceeds ${maxTokens} tokens: ${textToEmbedCount}`);
    }

    // Build the enriched JSON object:
    parsedResources.push({
      fqn,
      name,
      namespace,
      docs: {
        subcategory,
        pageTitle,
        metaDescription,
        summary: docDescription,
        url: docUrl,
        path: docFilePath ? path.relative(gitRoot, docFilePath) : undefined,
        resourceType,
      },
      arguments: argumentsSection,
      constructor: schemaForProps(resource.propsTypeRef),
      textToEmbed,
      textToEmbedCount,
      sourceFile,
    });
  }

  // write to file for caching
  fs.writeFileSync(outputFile, JSON.stringify(parsedResources, null, 2));
  console.log('Wrote to ' + outputFile);
} else {
  const cache = fs.readFileSync(outputFile, 'utf-8');
  parsedResources = JSON.parse(cache);
  console.log('Loaded existing resources: ', parsedResources.length);
}

const resourcesToEmbed: ResourceEmbedding[] = parsedResources
  .map(resource => {
    // Prepare metadata - store essential original info
    const metadata: ResourceMetadata = {
      fqn: resource.fqn, // use fqn to retreive original resource from json file
      name: resource.name,
      subcategory: resource.docs.subcategory,
      url: resource.docs.url,
      sourceFile: resource.sourceFile,
      originalText: resource.textToEmbed, // in case embedding strategy is changed
    };

    return {
      text: resource.textToEmbed,
      tokenCount: resource.textToEmbedCount,
      metadata,
    };
  })
  .filter(resource => resource.tokenCount <= maxTokens) // Filter out resources with too many tokens
  .sort((a, b) => b.tokenCount - a.tokenCount); // Sort your processedResources array in descending

// Batch and Embed resources
const batchSize = 300; // 1000; // maximum size for Upstash!
const batchCount = Math.ceil(resourcesToEmbed.length / batchSize);
console.log(`Total batches: ${batchCount}`);
const delayBetweenBatches = 60000; // 60 seconds to avoid rate limits
const allResources = resourcesToEmbed;

// Successfully embedded resources
const allEmbeddings: EmbeddingModelV1Embedding[] = [];
const embeddedResources: ResourceEmbedding[] = [];

console.log(`Starting embedding process for ${allResources.length} resources...`);
console.log(`Batch size: ${batchSize}, Delay between batches: ${delayBetweenBatches / 1000}s`);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

for (let i = 0; i < allResources.length; i += batchSize) {
  /**
   * Chunking (Resource-Level):
   * - currently, each processed resource is a chunk. We are not splitting individual resources further.
   *   and we are ignoring the resources where textToEmbed exceeds 8191 tokens ...
   * - We will have ~1500 chunks, one for each resource.
   */
  const batch = allResources.slice(i, i + batchSize);
  const chunks = batch.map(r => r.text);
  const batchNumber = Math.floor(i / batchSize) + 1;

  console.log(`Processing batch ${batchNumber}/${batchCount} (${batch.length} items)...`);
  // Optional: Log estimated tokens for this batch
  const estimatedBatchTokens = batch.reduce((sum, r) => sum + r.tokenCount, 0);
  console.log(`Estimated tokens for batch ${batchNumber}: ~${estimatedBatchTokens}`);

  try {
    const { embeddings: batchEmbeddings, usage } = await embedMany({
      model: openai.embedding(embeddingModel, {
        // // maxEmbeddingsPerCall - not used, lacks support for delay, likely exceeds rate limits
        // maxEmbeddingsPerCall: batchSize,
        dimensions,
      }),
      values: chunks,
    });
    const actualTokens = usage?.tokens ?? 'N/A';
    console.log(`Batch ${batchNumber} successful. Actual tokens used: ${actualTokens}`);

    // Ensure the order matches batchEmbeddings and batch
    await store.upsert({
      indexName,
      // Array of embedding vectors
      vectors: batchEmbeddings,
      // Array of corresponding metadata objects
      metadata: batch.map(r => r.metadata),
    });

    // aggregate all batches
    allEmbeddings.push(...batchEmbeddings);
    embeddedResources.push(...batch);
  } catch (error: any) {
    console.error(`Error processing batch ${batchNumber} (starting index ${i}):`, error);
    // Add robust error handling (check for 429, retry with backoff)
    console.warn(`Skipping failed batch ${batchNumber}. Implement retry logic!`);
    // break; // Or decide how to handle failures
  }

  // Wait only if there are more batches left
  if (i + batchSize < allResources.length) {
    console.log(`Waiting for ${delayBetweenBatches / 1000}s before next batch...`);
    await delay(delayBetweenBatches);
  }
}

console.log(`Embedding process finished. Total embeddings generated: ${allEmbeddings.length}`);

// locally store graphChunks for Mastra's graphRag Queries
// Combine embeddings with metadata
// Ensure the order matches embeddedResources and allEmbeddings
const chunksForGraph = embeddedResources.map((resource, index) => ({
  text: resource.text,
  metadata: resource.metadata,
  vector: allEmbeddings[index]!,
}));
const chunksForGraphOutput = path.join(outputDir, `aws-resources-${embeddingModel}.json`);
fs.writeFileSync(chunksForGraphOutput, JSON.stringify(chunksForGraph, null, 2));
console.log('Wrote to ' + chunksForGraphOutput);

// JSII Utility functions and interfaces

function schemaForProps(propsTypeRef: reflect.TypeReference | undefined) {
  if (!propsTypeRef) {
    return;
  }
  // if (propsTypeRef.fqn?.startsWith("@cdktf/provider-aws.")) {
  //   console.log("Skipping props " + propsTypeRef.fqn);
  //   return;
  // }
  return schemaForTypeReference(propsTypeRef);
}

// find initializer and props parameter index for a class
function unpackTopLevel(klass: reflect.ClassType, propsParamAt: number): ClassAndProps | undefined {
  if (!hasPropsParam(klass, propsParamAt)) {
    console.log('skipping (no propsParam) ' + (klass as reflect.ClassType).fqn);
    return undefined;
  }

  return {
    class: klass,
    propsTypeRef: klass.initializer?.parameters?.[propsParamAt]?.type,
  };
}

export interface ClassAndProps {
  class: reflect.ClassType;
  propsTypeRef?: reflect.TypeReference;
}

interface ParsedResource {
  fqn: string;
  name: string;
  namespace?: string;
  docs: {
    subcategory?: string;
    pageTitle?: string;
    metaDescription?: string;
    summary?: string;
    url?: string;
    path?: string;
    resourceType?: string;
  };
  arguments?: string;
  constructor?: reflect.TypeReference | undefined;
  sourceFile?: string;
  textToEmbed: string;
  textToEmbedCount: number;
}

// filtered data for embedding
export interface ResourceEmbedding {
  text: string;
  tokenCount: number;
  metadata: ResourceMetadata;
}

export interface ResourceMetadata {
  /**
   * The fully qualified name of the resource.
   * This is used as a unique identifier for the resource.
   */
  fqn: string;
  /**
   * The name of the resource from JSII schema.
   */
  name: string;
  /**
   * The Sub Category based on the Markdown documentation
   */
  subcategory?: string;
  /**
   * The URL to the resource documentation.
   */
  url?: string;
  /**
   * The source file where the resource is defined from the jsii schema.
   */
  sourceFile?: string;
  /**
   * The original text used for embedding.
   * This is useful for debugging or if the embedding strategy changes in the future.
   */
  originalText: string;
}

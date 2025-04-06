/**
 * Read, Embed and Store parsed AWS resources
 *
 * TextToEmbed for each resource is re-defined in this script for customizations
 *
 * Any resources exceeding OpenAI's limit for 'text-embedding-3-small' / 'text-embedding-3-large'
 * are filtered out.
 *
 * Resources are chunked and embedded in batches of 300 per call with a 60 second delay to avoid OpenAI rate limits.
 */
import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { EmbeddingModelV1Embedding } from '@ai-sdk/provider';
import { UpstashVector } from '@mastra/upstash';
import { embedMany } from 'ai';
import { TokenCounter } from '../util/tiktoken.js';
import { ParsedResource } from './ref-parse-jsii.js';
import { getUpstashConfig, OPENAI_EMBED_MAX_TOKENS } from './util.js';
import dotenv from 'dotenv';

dotenv.config();

// pre-created Upstash indexnames for TerraTitan are
//
// - 'provider-aws-resources-small'
// - 'provider-aws-resources-large'
const indexName = 'provider-aws-resources-large';
// file to read from ref-parse-jsii.ts script
const fileName = 'aws-resources';

// Get Pre-created Upstash Index configuration
// set up with pay as you go
// see: https://upstash.com/pricing/vector
const { dimensions, upstashUrl, upstashToken, embeddingModel } = getUpstashConfig(indexName);

if (!upstashToken) {
  throw new Error(`Missing UPSTASH_TOKEN_xxx environment variable for ${indexName}`);
}

// if output file exists, load it instead of rebuilding it
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}
const inputFile = path.join(outputDir, fileName + '.json');
if (!fs.existsSync(inputFile)) {
  console.log('Missing inputFile:', inputFile);
  console.log('Run ref-parse script first?');
  process.exit(0);
}

const cache = fs.readFileSync(inputFile, 'utf-8');
const parsedResources: ParsedResource[] = JSON.parse(cache);
console.log('Loaded existing resources: ', parsedResources.length);

const counter = new TokenCounter(embeddingModel);
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

    // Consider adding more fields or structuring differently
    const textToEmbed = `
      Subcategory: ${resource.docs.subcategory}
      FQN: ${resource.fqn}
      Name: ${resource.name}
      Description: ${resource.docs.summary}
      Arguments: ${resource.arguments}
    `.trim();
    const [textToEmbedCount = 0] = counter.count(textToEmbed);

    // warn if text to embed exceeds maxTokens
    if (textToEmbedCount > OPENAI_EMBED_MAX_TOKENS) {
      console.warn(`Text to embed for ${resource.fqn} exceeds ${OPENAI_EMBED_MAX_TOKENS} tokens: ${textToEmbedCount}`);
    }
    return {
      text: textToEmbed,
      tokenCount: textToEmbedCount,
      metadata,
    };
  })
  .filter(resource => resource.tokenCount <= OPENAI_EMBED_MAX_TOKENS) // Filter out resources with too many tokens
  .sort((a, b) => b.tokenCount - a.tokenCount); // Sort your processedResources array in descending

// Batch and Embed resources
const batchSize = 300; // 1000; // maximum batchSize for Upstash upsert!
const batchCount = Math.ceil(resourcesToEmbed.length / batchSize);
console.log(`Total batches to embed/index: ${batchCount}`);
// sleep 60 seconds between batches to avoid rate limits
const delayBetweenBatches = 60000;
const allResources = resourcesToEmbed;

// Successfully embedded resources
const allEmbeddings: EmbeddingModelV1Embedding[] = [];
const embeddedResources: ResourceEmbedding[] = [];

console.log(`Starting embedding process for ${allResources.length} resources...`);
console.log(`Batch size: ${batchSize}, Delay between batches: ${delayBetweenBatches / 1000}s`);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Configure index specific Vector Store
const store = new UpstashVector({
  url: upstashUrl,
  token: upstashToken,
});

/**
 * Chunking strategy > By Resource:
 * - currently, each processed resource is a chunk. We are not splitting individual resources further.
 *   and we are the resources where textToEmbed exceeding maxTokens were filtered out...
 * - We will have ~1500 chunks, one for each resource.
 */
for (let i = 0; i < allResources.length; i += batchSize) {
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

    // aggregate all batches for local caching (and GraphRAG usage)
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
// Combining all embeddings with resource metadata
// Ensure the order matches embeddedResources and allEmbeddings
const chunksForGraph = embeddedResources.map((resource, index) => ({
  text: resource.text,
  metadata: resource.metadata,
  vector: allEmbeddings[index]!,
}));
const chunksForGraphOutput = path.join(outputDir, `aws-resources-${embeddingModel}.json`);
fs.writeFileSync(chunksForGraphOutput, JSON.stringify(chunksForGraph, null, 2));
console.log('Wrote to ' + chunksForGraphOutput);

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

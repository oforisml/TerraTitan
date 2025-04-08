/**
 * Read and Embed parsed AWS resources for local GraphRAG only
 *
 * TextToEmbed contains only the resource name and summary.
 *
 * Resources are chunked and embedded in batches of 1000 per call with a 60 second delay to avoid OpenAI rate limits.
 */
import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { EmbeddingModelV1Embedding } from '@ai-sdk/provider';
import { embedMany } from 'ai';
import { TokenCounter } from '../util/tiktoken.js';
import { ParsedResource } from './ref-parse-jsii.js';
import { loadJsonSync, OPENAI_EMBED_MAX_TOKENS, ResourceChunk, ResourceEmbedding, ResourceMetadata } from './util.js';
import dotenv from 'dotenv';

dotenv.config();

const embeddingModel = 'text-embedding-3-small';
const dimensions = 1536; // default for 'text-embedding-3-small'
const outputDir = path.join(process.cwd(), 'output');

// file to read from ref-parse-jsii.ts script
const parsedResources = loadJsonSync<ParsedResource[]>(outputDir, 'aws-resources.json');
console.log('Loaded existing resources: ', parsedResources.length);

const counter = new TokenCounter(embeddingModel);
const resourcesToEmbed: ResourceEmbedding[] = parsedResources
  .map(resource => {
    // Consider adding more fields or structuring differently
    const textToEmbed = `
      Name: ${resource.name}
      Description: ${resource.docs.summary}
    `.trim();
    const [textToEmbedCount = 0] = counter.count(textToEmbed);

    // warn if text to embed exceeds maxTokens
    if (textToEmbedCount > OPENAI_EMBED_MAX_TOKENS) {
      console.warn(`Text to embed for ${resource.fqn} exceeds ${OPENAI_EMBED_MAX_TOKENS} tokens: ${textToEmbedCount}`);
    }
    // Prepare metadata - store essential original info
    const metadata: ResourceMetadata = {
      fqn: resource.fqn, // use fqn to retreive original resource from json file
      name: resource.name,
      subcategory: resource.docs.subcategory,
      url: resource.docs.url,
      sourceFile: resource.sourceFile,
      // TODO: Should be "text" instead of "originalText" for reranking
      originalText: textToEmbed, // resource.textToEmbed, // in case embedding strategy is changed
    };

    return {
      text: textToEmbed,
      tokenCount: textToEmbedCount,
      metadata,
    };
  })
  .filter(resource => resource.tokenCount <= OPENAI_EMBED_MAX_TOKENS) // Filter out resources with too many tokens
  .sort((a, b) => b.tokenCount - a.tokenCount); // Sort your processedResources array in descending

// Batch and Embed resources
const batchSize = 1000;
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
const chunksForGraph: ResourceChunk[] = embeddedResources.map((resource, index) => ({
  text: resource.text,
  metadata: resource.metadata,
  vector: allEmbeddings[index]!,
}));
const chunksForGraphOutput = path.join(outputDir, `aws-resources-summary-${embeddingModel}.json`);
fs.writeFileSync(chunksForGraphOutput, JSON.stringify(chunksForGraph, null, 2));
console.log('Wrote to ' + chunksForGraphOutput);

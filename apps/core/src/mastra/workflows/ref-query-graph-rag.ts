/**
 * Load and Query chunked CDKTF AWS resources embeddings with Mastra's GraphRAG
 *
 * This script loads chunks from disk into the GraphRAG structure,
 * then queries the graph using the full TypeScript interface declaration for CfnTargetGroupProps.
 *
 * The embedding per CDKTF Resource includes
 * - Summary section from the Markdown doc files.
 * - Arguments data from the Markdown doc files.
 *
 * This example retrieves the top 5 related nodes based on a sample user query
 */
import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { GraphRAG } from '@mastra/rag';
import { embed } from 'ai';
import { filterGeneratedModule, gitRoot } from '../util/helpers.js';
import { TiktokenModel } from 'tiktoken';
import { TokenCounter } from '../util/tiktoken.js';
import { OPENAI_EMBED_MAX_TOKENS, ResourceChunk, ResourceMetadata } from './util.js';
import dotenv from 'dotenv';

dotenv.config();

const outputDir = path.join(process.cwd(), 'output');
const embeddingModel = 'text-embedding-3-large' as TiktokenModel;
// dimensions - ref https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-providers--models
// By default, the length of the embedding vector is 1536 for 'text-embedding-3-small' or 3072 for 'text-embedding-3-large'
const dimensions = embeddingModel === 'text-embedding-3-large' ? 3072 : 1536;
const counter = new TokenCounter(embeddingModel);

const chunksForGraphOutput = path.join(outputDir, `aws-resources-${embeddingModel}.json`);
if (!fs.existsSync(chunksForGraphOutput)) {
  throw new Error(`Chunks file ${chunksForGraphOutput} does not exist.`);
}
const chunksForGraph = JSON.parse(fs.readFileSync(chunksForGraphOutput, 'utf-8')) as ResourceChunk[];

// Initialize GraphRAG
// https://github.com/mastra-ai/mastra/blob/%40mastra/rag%400.1.14/packages/rag/src/graph-rag/index.ts#L149
const graphRag = new GraphRAG(
  dimensions,
  // Similarity threshold for creating edges between nodes (0-1)
  0.7,
);
// This builds the relationships based on embedding similarity
graphRag.createGraph(chunksForGraph, chunksForGraph);

// --- Sample Query ---

const awsCdkPkgDir = path.join(gitRoot, 'data', 'reference', 'declarations', 'aws-cdk-lib');
const refFile = path.join(awsCdkPkgDir, 'aws-elasticloadbalancingv2', 'lib', 'elasticloadbalancingv2.generated.d.ts');
const refContents = fs.readFileSync(refFile, 'utf-8');
const filteredReferenceData = filterGeneratedModule(refContents, ['CfnTargetGroupProps']);

const userQueryText = `
  What CDKTF Resources are relevant to CloudFormation CfnTargetGroupProps:
  ${filteredReferenceData}
`;

const [filteredContentsCount = 0, userQueryTextCount = 0] = counter.count(filteredReferenceData, userQueryText);
console.log(`filtered Contents Tokens:  ${filteredContentsCount}`);
console.log(`userQueryTextCount Tokens: ${userQueryTextCount}`);
if (userQueryTextCount > OPENAI_EMBED_MAX_TOKENS) {
  throw new Error(`User Query exceeds embedding model max tokens: ${userQueryTextCount} > ${OPENAI_EMBED_MAX_TOKENS}`);
}

const { embedding: queryEmbedding } = await embed({
  model: openai.embedding(embeddingModel, {
    dimensions,
  }),
  value: userQueryText,
});

// Query the graph
const results = graphRag.query({
  query: queryEmbedding,
  topK: 5, // Retrieve top 5 related nodes (adjust as needed)
  randomWalkSteps: 100, // Default
  restartProb: 0.15, // Default
});

// Process results
console.log('Graph RAG Results:');
results.forEach(node => {
  console.log(`Score: ${node.score}`);
  const metadata = node.metadata as ResourceMetadata | undefined;
  if (metadata) {
    console.log(`FQN: ${metadata.fqn}`);
    console.log(`subcategory: ${metadata.subcategory}`);
    console.log(`sourceFile: ${metadata.sourceFile}`);
    console.log(`originalText: ${metadata.originalText.substring(0, 100) + '...'}`);
  } else {
    console.warn('No metadata found for node:', node);
    console.log(`content: ${node.content.substring(0, 100) + '...'}`); // Show some content
  }
  console.log('---');
});

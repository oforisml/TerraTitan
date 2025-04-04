import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { GraphRAG } from '@mastra/rag';
import { embed } from 'ai';
import { filterGeneratedModule, gitRoot } from './../util/helpers.js';
import { TokenCounter } from '../util/tiktoken.js';

import dotenv from 'dotenv';
dotenv.config();

// OpenAI's limit for 'text-embedding-3-small' / 'text-embedding-3-large'
const maxTokens = 8191;

// if output file exists, load it instead of rebuilding it
const outputDir = path.join(process.cwd(), 'output');
if (!fs.existsSync(outputDir)) {
  throw new Error(`Output directory ${outputDir} does not exist.`);
}

// dimensions - ref https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-providers--models
// By default, the length of the embedding vector is 1536 for 'text-embedding-3-small' or 3072 for 'text-embedding-3-large'
const dimensions = 1536;
const embeddingModel = 'text-embedding-3-small';
const counter = new TokenCounter(embeddingModel);

const chunksForGraphOutput = path.join(outputDir, `aws-resources-${embeddingModel}.json`);
if (!fs.existsSync(chunksForGraphOutput)) {
  throw new Error(`Chunks file ${chunksForGraphOutput} does not exist.`);
}
// Load the Graph chunks from the file
const chunksForGraph = JSON.parse(fs.readFileSync(chunksForGraphOutput, 'utf-8'));

// Create GraphRag
// https://github.com/mastra-ai/mastra/blob/%40mastra/rag%400.1.14/packages/rag/src/graph-rag/index.ts#L149
// Initialize GraphRAG
const graphRag = new GraphRAG(
  dimensions,
  // Similarity threshold for creating edges between nodes (0-1)
  0.7,
);
// This builds the relationships based on embedding similarity
graphRag.createGraph(chunksForGraph, chunksForGraph);

// --- Query Time ---

const awsCdkPkgDir = path.join(gitRoot, 'data', 'reference', 'declarations', 'aws-cdk-lib');
const refFile = path.join(awsCdkPkgDir, 'aws-elasticloadbalancingv2', 'lib', 'elasticloadbalancingv2.generated.d.ts');
const refContents = fs.readFileSync(refFile, 'utf-8');
const filteredContents = filterGeneratedModule(refContents, ['CfnTargetGroupProps']);

const userQueryText = `
  CloudFormation CfnTargetGroupProps:
  ${filteredContents}
  What is the equivalent CDKTF resource for this?
`;

const [filteredContentsCount = 0, userQueryTextCount = 0] = counter.count(filteredContents, userQueryText);
console.log(`filtered Contents Tokens:  ${filteredContentsCount}`);
console.log(`userQueryTextCount Tokens: ${userQueryTextCount}`);
if (userQueryTextCount > maxTokens) {
  throw new Error(`Filtered contents exceeds embdding model max tokens: ${userQueryTextCount} > ${maxTokens}`);
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
  console.log(`FQN: ${node.metadata?.fqn}`);
  console.log(`subcategory: ${node.metadata?.subcategory}`);
  console.log(`content: ${node.content.substring(0, 100) + '...'}`); // Show some content
  console.log('---');
});

/**
 * Load and Query chunked CDKTF AWS resources "Summary" embeddings with Mastra's GraphRAG
 *
 * This script loads chunks from disk into the GraphRAG structure,
 * then queries the graph using the JSDoc of a specific Cfn AWS resource (CfnTargetGroup) only.
 *
 * It retrieves the top 10 related nodes based on the query and prints their details.
 */
import * as fs from 'fs';
import * as path from 'path';
import { openai } from '@ai-sdk/openai';
import { GraphRAG } from '@mastra/rag';
import { embed } from 'ai';
import { Project } from 'ts-morph';
import { gitRoot } from '../util/helpers.js';
import { TiktokenModel } from 'tiktoken';
import { TokenCounter } from '../util/tiktoken.js';
import { OPENAI_EMBED_MAX_TOKENS, ResourceChunk, ResourceMetadata } from './util.js';
import dotenv from 'dotenv';

dotenv.config();

const embeddingModel = 'text-embedding-3-small' as TiktokenModel;
// load chunks from disk
const outputDir = path.join(process.cwd(), 'output');
const chunksForGraphOutput = path.join(outputDir, `aws-resources-summary-${embeddingModel}.json`);
if (!fs.existsSync(chunksForGraphOutput)) {
  throw new Error(`Chunks file ${chunksForGraphOutput} does not exist.`);
}
const chunksForGraph = JSON.parse(fs.readFileSync(chunksForGraphOutput, 'utf-8')) as ResourceChunk[];

// dimensions - ref https://sdk.vercel.ai/docs/ai-sdk-core/embeddings#embedding-providers--models
// By default, the length of the embedding vector is 3072 for 'text-embedding-3-large' or 1536 for 'text-embedding-3-small'
const dimensions = embeddingModel === 'text-embedding-3-large' ? 3072 : 1536;
const counter = new TokenCounter(embeddingModel);
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

// get JSDoc for CfnTargetGroup class only
const project = new Project();
const sourceFile = project.addSourceFileAtPath(refFile);
const jsDocs = sourceFile
  .getClassOrThrow('CfnTargetGroup')
  .getJsDocs()
  .map(jsDoc => jsDoc.getInnerText())
  .join('\n');

console.log('JSDoc:', jsDocs);

// const userQueryText = jsDocs;
const userQueryText = `
  What CDKTF Resources are relevant to CfnTargetGroup:
  ${jsDocs}
`;

// // Get full Typescript declaration for CfnTargetGroupProps
// const refContents = fs.readFileSync(refFile, 'utf-8');
// const filteredReferenceData = filterGeneratedModule(refContents, ['CfnTargetGroupProps']);

// const userQueryText = `
//   What CDKTF Resources are relevant to CloudFormation CfnTargetGroup:
//   ${filteredReferenceData}
// `;

const [jsDocsCount = 0, userQueryTextCount = 0] = counter.count(jsDocs, userQueryText);
console.log(`JSDocs Contents Tokens:  ${jsDocsCount}`);
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
  topK: 10, // Retrieve top 10 related nodes (adjust as needed)
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

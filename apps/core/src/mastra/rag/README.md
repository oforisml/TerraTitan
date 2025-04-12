# Retrieval Augmented Generation scripts

## Overview

These scripts were written to determine how to use RAG for TerraTitan Conversion workflows.

## Parse JSII

[JSII](https://aws.github.io/jsii/) is the core technology enabling the AWS Cloud Development Kit and the CDK ecosystem.

Every CDK package that supports JSII, includes the [jsii Assembly document](https://aws.github.io/jsii/specification/1-introduction/#concepts) containing a specific representation of the API exported by the TypeScript module.

This was the starting point to index the contents of CDK libraries for embedding.

Additionaly, the Markdown docs from the `provider-aws` GitHub repository were combined with the contents of the `@cdktf/provider-aws` JSII Package.

> The parse-jsii.ts script generated the `aws-resources.json` file of all CDKTF provider-aws resources.

## Embed

Embed scripts use the contents of the `parse-jsii` script and determine how to Chunk and what to embed into vectors using different embedding models.

 | script             | description |
 |--------------------|-------------|
 | `embed.ts`         | First iteration capturing both the `Summary` and `Arguments` docs section for each `provider-aws` resource |
 | `embed-summary.ts` | Final iteration capturing just the `Summary` docs section for each `provider-aws` resource |

 > [!WARNING]
 > The `embed.ts` script both generates embeddings, writes them to disk (`.gitignore`) and stores them in [Upstash](https://upstash.com/) Vector Indices.

 ## Store

 Store scripts use the output of Embed scripts and stores them in a VectorDb of choice.

 - `store-summary.ts`: Stores the result of `embed-summary.ts` into a specific [Upstash](https://upstash.com/) Vector Indices + namespace.

## Query

Query scripts are used to try out Mastra's Retrieval functionality.


 | script                            | description |
 |-----------------------------------|-------------|
 | `query-graph-rag.ts`              | First iteration using Mastra's built-in GraphRAG utilities (this does not use a VectorDb, loading all data in memory - acceptable given the size of the data) |
 | `query-upstash-rerank.ts`         | Trials using Upstash Similarity Search with Mastra's rerank function on `embed.ts` output |
 | `query-summary-graph-rag.ts`      | Trials using Mastra's GraphRAG on `embed-summary.ts` output |
 | `query-summary-upstash-rerank.ts` | Final iteration using Upstash Similarity Search with Mastra's rerank function on `embed-summary.ts` output |


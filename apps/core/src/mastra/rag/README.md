# Retrieval Augmented Generation (RAG)

This section details methodology and exploration using Mastra RAG.

## Overview

These scripts were written to determine how to use RAG for TerraTitan Conversion workflows.

## Parse JSII

[JSII](https://aws.github.io/jsii/) is the core technology enabling the AWS Cloud Development Kit and the CDK ecosystem.

Every CDK package that supports JSII, includes the [jsii Assembly document](https://aws.github.io/jsii/specification/1-introduction/#concepts) containing a specific representation of the API exported by the TypeScript module.

This was the starting point to index the contents of CDK libraries for embedding.

Additionaly, the Markdown docs from the `provider-aws` GitHub repository were combined with the contents of the `@cdktf/provider-aws` JSII Package.

> The parse-jsii.ts script generated the `aws-resources.json` file of all CDKTF provider-aws resources.

### Reasoning

1. Used [JSII Reflect](https://github.com/aws/jsii/tree/main/packages/jsii-reflect) to load the `@cdktf/provider-aws` library of resources and parse into a json file (also loads actual markdown Typescript documentation).
1. Defined initial `textToEmbed` structure per Resource and captured current Token count to determine chunking strategy.
1. Calculated the Token size for each resource (considering OpenAI embedding model token limits, this suggested chunking by resource should work)
1. Evaluated buckets of Resource `textToEmbed` token counts as follows:

   ```bash
   jq '
   [.[] | select(.textToEmbedCount != null) |
      (
         if .textToEmbedCount < 500 then "small (0-499)"
         elif .textToEmbedCount < 1000 then "medium (500-999)"
         elif .textToEmbedCount < 1500 then "large (1000-1499)"
         else "xlarge (1500+)"
         end
      )
   ] |
   group_by(.) |
   map({bucket: .[0], count: length})
   ' ./output/aws-resources.json
   ```

   Initial strategy buckets:

   ```json
   [
      {
         "bucket": "xlarge (1500+)",
         "count": 121
      },
      {
         "bucket": "large (1000-1499)",
         "count": 66
      },
      {
         "bucket": "medium (500-999)",
         "count": 265
      },
      {
         "bucket": "small (0-499)",
         "count": 1046
      }
   ]
   ```

   This suggests a batch size of 1000 chunks per `embedMany` API call should not exceed the `Tier 1` OpenAI Embedding Rate limit of TPM Limit: 1,000,000 tokens/minute. (decided to use a conservative 300 resources per embedding call)

> [!WARNING]
> Upstash Upsert batch size has a maximum of `1,000` items!

## Embed

Embed scripts use the contents of the `parse-jsii` script and determine how to Chunk and what to embed into vectors using different embedding models.

 | script             | description |
 |--------------------|-------------|
 | `embed.ts`         | First iteration capturing both the `Summary` and `Arguments` docs section for each `provider-aws` resource |
 | `embed-summary.ts` | Final iteration capturing just the `Summary` docs section for each `provider-aws` resource |

 > [!WARNING]
 > The `embed.ts` script both generates embeddings, writes them to disk (`.gitignore`) and stores them in [Upstash](https://upstash.com/) Vector Indices.


```console
# First pass: Load npm pkg information and augment with TF Provider Markdown docs
pnpm exec tsx src/mastra/rag/prase-jsii.ts

# Generate embedding vectors and upsert into Upstash
# (requires OpenAI API key and Upstash Token for desired index)
pnpm exec tsx src/mastra/workflows/embed.ts

# Generate embedding (but don't index) from
# - Resource Name
# - Markdown Resource Summary only (don't include Resource Arguments)
pnpm exec tsx src/mastra/workflows/embed-summary.ts
```

Creates (gitignored):

- `outputs/aws-resources-text-embedding-3-large.json` ~99MB @ $0.13 / million Tokens
- `outputs/aws-resources-text-embedding-3-small.json` ~53MB @ $0.02 / million Tokens
- `outputs/aws-resources-summary-text-embedding-3-small.json` ~50MB @ $0.02 / million Tokens

## Store

 Store scripts use the output of Embed scripts and stores them in a VectorDb of choice.

 - `store-summary.ts`: Stores the result of `embed-summary.ts` into a specific [Upstash](https://upstash.com/) Vector Index + namespace.

## Query

Query scripts are used to try out Mastra's Retrieval functionality.


 | script                            | description |
 |-----------------------------------|-------------|
 | `query-graph-rag.ts`              | First iteration using Mastra's built-in GraphRAG utilities (this does not use a VectorDb, loading all data in memory - acceptable given the size of the data) |
 | `query-upstash-rerank.ts`         | Trials using Upstash Similarity Search with Mastra's rerank function on `embed.ts` output |
 | `query-summary-graph-rag.ts`      | Trials using Mastra's GraphRAG on `embed-summary.ts` output |
 | `query-summary-upstash-rerank.ts` | Final iteration using Upstash Similarity Search with Mastra's rerank function on `embed-summary.ts` output |


### Graph RAG queries

Experiment using [Mastra: GraphRAG](https://mastra.ai/docs/reference/rag/graph-rag) feature to test relevance queries. (Requires OpenAI key, but no Upstash queries are used).

> [!WARNING]
> Appropriate `outputs/aws-resources-*.json` must exist (gitignored).

To run a local Graph RAG query using the full Cfn TS Interface Declaration signature:

```console
pnpm exec tsx src/mastra/rag/query-graph-rag.ts
```

> [!WARNING]
> Appropriate `outputs/aws-resources-summary-*.json` must exist (gitignored).

To run a local Graph RAG query using the JSDocs of the Cfn TS Class Declaration only:

```console
pnpm exec tsx src/mastra/rag/query-summary-graph-rag.ts
```

Decided to stick to simple Upstash index queries instead.

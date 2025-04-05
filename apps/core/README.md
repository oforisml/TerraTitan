# Core

TerraTitan Core Workflows using Mastra.

[mastra](https://mastra.ai) is an open-source TypeScript agent framework

## Prerequisites

1. **Set up the Gemini API:**

   - Follow the Gemini API [Quickstart](https://ai.google.dev/gemini-api/docs/quickstart?lang=node)
   - Get API Key from [aistudio - apikey](https://aistudio.google.com/apikey)

1. **Set the Gemini API Key:**

   Set the `GOOGLE_GENERATIVE_AI_API_KEY` environment variable in the project: Create a `.env` file at the root of the project and add the following line (see `.env.exmaple` for reference):

   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=<your_api_key>
   ```

1. **To install dependencies:**

   ```bash
   pnpm install
   ```

1. **To run Mastra dashboard:**

   ```bash
   pnpm dev
   ```

1. **To Programmatically start the workflows defined under `src/index.ts`:**

   ```bash
   pnpm start
   ```

This project follow [mastra project structure](https://mastra.ai/docs/getting-started/project-structure)

## Upstash Vector

Retrieval Augmented Prompt generation with Vector embeddings. To set up your local environment:

1. Request to be added to the TerraTitan team on [Upstash](https://upstash.com/).
1. Get Upstash Tokens for both upstash indices

### Embedding methodology

Initial approach on what to embed:

1. Used [JSII Reflect](https://github.com/aws/jsii/tree/main/packages/jsii-reflect) to load the `@cdktf/provider-aws` library of resources and parse into a json file (also loaded actual markdown Typescript documentation).
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

```console
# First pass: Load npm pkg information and augment with TF Provider Markdown docs
pnpx tsx src/mastra/workflows/ref-prase-jsii.ts

# Generate embedding vectors and upsert into Upstash
# (requires OpenAI API key and Upstash Token for desired index)
pnpx tsx src/mastra/workflows/ref-embed.ts

# Generate embedding (but don't index) from
# - Resource Name
# - Markdown Resource Summary only (don't include Resource Arguments)
pnpx tsx src src/mastra/workflows/ref-embed-summary.ts
```

Creates (gitignored):

- `outputs/aws-resources-text-embedding-3-large.json` ~99MB @ $0.13 / million Tokens
- `outputs/aws-resources-text-embedding-3-small.json` ~53MB @ $0.02 / million Tokens
- `outputs/aws-resources-summary-text-embedding-3-small.json` ~50MB @ $0.02 / million Tokens

### Graph RAG queries

Used [Mastra: GraphRAG](https://mastra.ai/docs/reference/rag/graph-rag) feature to test relevance queries. (Requires OpenAI key, but no Upstash queries are used).

> [!WARNING]
> Appropriate `outputs/aws-resources-*.json` must exist (gitignored).

To run a local Graph RAG query using the full Cfn TS Interface Declaration signature:

```console
pnpx tsx src/mastra/workflows/ref-query-graph-rag.ts
```

> [!WARNING]
> Appropriate `outputs/aws-resources-summary-*.json` must exist (gitignored).

To run a local Graph RAG query using the JSDocs of ahe Cfn TS Class Declaration only:

```console
pnpx tsx src/mastra/workflows/ref-query-summary-graph-rag.ts
```

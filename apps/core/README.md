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

1. Used [JSII Reflect](https://github.com/aws/jsii/tree/main/packages/jsii-reflect) to load the `@cdktf/provider-aws` library of resources and parse into a json file (added linking to the actual markdown Typescript documentation).
1. Defined textToEmbed structure per Resource.
1. Calculated the Token size for each resource (most fit within the OpenAI embedding model token limits, this suggests chunking by resource will fit)
1. Evaluated buckets of Resource textToEmbed token counts as follows:

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

   Buckets:

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

   This suggests a batch size of 1000 chunks per `embedMany` call should not exceed the Tier1 OpenAI Embedding Rate limit of TPM Limit: 1,000,000 tokens/minute. (decided to use a conservative 300 resources per embedding call)

> [!WARNING]
> Upstash Upsert batch size has a maximum of `1,000` items!

```console
# requires Upstash Token for selected embeddingModel...
pnpx tsx src/mastra/workflows/embed.ts
```

Creates: `outputs/aws-resources-text-embedding-3-small.json` (gitignored).

### Graph Rag queries

Used [Mastra: GraphRAG](https://mastra.ai/docs/reference/rag/graph-rag) feature to test relevance queries. (Requires OpenAI key, but no Upstash queries are used).

Note: `outputs/aws-resources-text-embedding-3-small.json` must exist (gitignored).

```console
pnpx tsx src/mastra/workflows/query-graph-rag.ts
```

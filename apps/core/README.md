# Core

TerraTitan Core Workflows using Mastra.

[mastra](https://mastra.ai) is an open-source TypeScript LLM Agent framework

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

1. **To run Mastra playground:**

   ```bash
   pnpm dev
   ```

1. **To Programmatically start the workflows defined under `src/index.ts`:**

   ```bash
   pnpm start
   ```

This project follows [mastra project structure](https://mastra.ai/docs/getting-started/project-structure)

## Upstash Vector

Retrieval Augmented Prompt generation with Vector embeddings. To set up your local environment:

1. Request to be added to the TerraTitan team on [Upstash](https://upstash.com/).
1. Get Upstash Tokens for both upstash indices

Refer to [RAG Readme](./src/mastra/rag/README.md) for mor information on how Upstash is used.

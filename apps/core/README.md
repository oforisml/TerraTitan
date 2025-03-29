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

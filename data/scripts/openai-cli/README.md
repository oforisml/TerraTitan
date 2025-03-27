# OpenAI CLI

PoC CLI using OpenAI models to convert AWSCDK to TerraConstructs.

Refer to [OpenAI Changelog](https://platform.openai.com/docs/changelog) for latest announcements

## Prerequisites

1. **Install** [Bun](https://bun.sh/) runtime

1. **Set up the OpenAI & Gemini API:**

   - If you're new to the OpenAI API, [sign up for an account](https://platform.openai.com/signup).
   - Follow the [Quickstart](https://platform.openai.com/docs/quickstart) to retrieve your API key.

   For Gemini

   - Follow the Gemini API [Quickstart](https://ai.google.dev/gemini-api/docs/quickstart?lang=node)
   - Get API Key from [aistudio - apikey](https://aistudio.google.com/apikey)

1. **Set the OpenAI API key:**

   Set the `OPENAI_API_KEY` environment variable in the project: Create a `.env` file at the root of the project and add the following line (see `.env.example` for reference):

   ```bash
   OPENAI_API_KEY=<your_api_key>
   ```

1. **set the Gemini API Key:**

   Set the `GEMINI_API_KEY` environment variable in the project: Create a `.env` file at the root of the project and add the following line (see `.env.exmaple` for reference):

   ```bash
   GEMINI_API_KEY=<your_api_key>
   ```

1. **Set the BrainTrust API Key:**

   > NOTE: BrainTrust is NOT currently used for advanced Evals. See [BrainTrust Evals](#braintrust-evals)

## Installation

To install dependencies:

```bash
bun install
```

To run:

>[!TIP]
> use `--dry-run` to only generate the prompt without making any calls to OpenAI API

```bash
bun run index.ts --dry-run
```

Get OpenAI Response:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Prompt iteration

Start with the [OpenAI Playground](https://platform.openai.com/playground/prompts?models=gpt-4o-mini) and use the `code <>` button to get a sample SDK Request.

Iterate on templates:

- [instructions-v1.md](./prompts/instructions-v1.md)
- [user-prompt-v1.md](./prompts/user-prompt-v1.md)
- [assistant-sample-v1.md](./prompts/assistant-sample-v1.md)

Supported Template values - see [prompts/index.ts](./prompts/index.ts).

## Generate Sample

```bash
bun gen-sample.ts
```

## Generate Requests

```bash
bun gen-requests.ts
```

## BrainTrust Evals

> [!NOTE]
> This is not used yet

Refer to [BrainTrust Cookbook](https://cookbook.openai.com/examples/custom-llm-as-a-judge)

```
npx braintrust eval tutorial.eval.ts
```

## References

- [OpenAI New API Starter App](https://github.com/openai/openai-responses-starter-app/tree/main): An extensive NextJS starter to build interactive web interface leveraging web-search, tools-usage, ....
- [Gemini JS SDK](https://github.com/googleapis/js-genai).

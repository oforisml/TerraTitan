# openai-cli

Sample CLI using OpenAI models to convert AWSCDK to TerraConstructs.

[OpenAI Changelog](https://platform.openai.com/docs/changelog)

## Prerequisites

1. **Install** [Bun](https://bun.sh/) runtime

1. **Set up the OpenAI API:**

   - If you're new to the OpenAI API, [sign up for an account](https://platform.openai.com/signup).
   - Follow the [Quickstart](https://platform.openai.com/docs/quickstart) to retrieve your API key.

1. **Set the OpenAI API key:**

   Set the `OPENAI_API_KEY` environment variable in the project: Create a `.env` file at the root of the project and add the following line (see `.env.example` for reference):

   ```bash
   OPENAI_API_KEY=<your_api_key>
   ```

1. **Set the BrainTrust API Key:**

   > NOTE: BrainTrust can be used for advanced Evals. See [BrainTrust Evals](#braintrust-evals)

## Installation

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.5. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Prompt iteration

Start with the [OpenAI Playground](https://platform.openai.com/playground/prompts?models=gpt-4o-mini)

Iterate on the script in `index.ts`.

## BrainTrust Evals

[BrainTrust Cookbook](https://cookbook.openai.com/examples/custom-llm-as-a-judge)

```
npx braintrust eval tutorial.eval.ts
```

## References

- [OpenAI New API Starter App](https://github.com/openai/openai-responses-starter-app/tree/main): An extensive NextJS starter to build interactive web interface leveraging web-search, tools-usage, ....

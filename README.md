# TerraTitan

<img src="docs/terratitan.webp" alt="TerraTitan Logo" width="300px">

> Convert AWS CDK Constructs to Terraform-CDK using LLM

TerraTitan is an LLM-powered workflow that converts AWS CDK constructs to Terraform CDK (CDKTF). This tool is a major component used to generate and maintain the [TerraConstructs](https://github.com/TerraConstructs/base) library, providing reliable and trustworthy infrastructure components for everyone to use.

## Goals

- Automated conversion of AWS CDK constructs to Terraform CDK
- Generate code for Unit Tests (+ future: and integration testing to ensure reliability)
- CLI to manage LLM Code generation workflow

## Repo Layout

```console
.
├── apps
│  └── core                     # Core TerraTitan app
├── data
│  ├── reference                # Reference Data for LLM Prompting
│  │  ├── declarations          # Typescript declaration files
│  │  │   ├── aws-cdk-lib
│  │  │   ├── provider-aws
│  │  │   └── terraconstructs
│  │  ├── docs                  # Terraform Provider Docs (markdown)
│  │  │   ├── provider-aws
│  │  │   └── typescript
│  │  └── merged                # Typescript declaration merged with Provider Docs
│  │      └── provider-aws
│  ├── samples                  # AWS CDK -> CDKTF Sample conversions ( for few shot prompting + validation Evals)
│  │  ├── aws-events
│  │  ├── aws-iam
│  │  ├── aws-kinesis
│  │  ├── aws-sns
│  │  ├── aws-sqs
│  │  └── README.md
│  └── scripts                  # PoC Scripts to  ...
│     ├── claude-cli            # ... Anthropic prompt benchmarking (using bun.sh)
│     ├── mastra                # ... Mastra PoC workspaces (using NodeJS + pnpm)
│     ├── merge-docs            # ... merge Markdown docs into CDKTF provider declaration files (using bun.sh)
│     ├── openai-cli            # ... OpenAI/Gemini prompt benchmarking (using bun.sh)
│     ├── research-assitant     # ... demo mastra workflow (using bun.sh)
│     ├── tf-doc-scrape.sh      # ... download copy of Terraform Docs (markdown)
│     └── validate-file         # ... run tsc syntax check on sourceFile
└── packages
   ├── eslint-config
   ├── typescript-config
   └── vitest-config
```

## Pnpm Worskpaces and Turbo Repo

This repository uses [pnpm](https://pnpm.io/) workspaces and [turbo](https://turbo.build) to easily manage and publish multiple apps and libraries.

### Getting Started

- Install [NodeJS](https://nodejs.org/en/download) using nvm
- Enable [corepack](https://github.com/nodejs/corepack?tab=readme-ov-file#default-installs):

  ```bash
  corepack enable
  ```

- Install repo-wide dependencies:

  ```bash
  pnpm install
  ```

### Run tasks

- `pnpm run test`: Runs the test in each package using Turborepo.
- `pnpm run view-report`: Collects coverage from each package and shows it in a merged report.
- `pnpm run build`: Runs build task
- `pnpm run repo-lint`: Lints repo-wide dependency versions

### Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks)
- [Caching](https://turbo.build/repo/docs/core-concepts/caching)
- [Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Filtering](https://turbo.build/repo/docs/core-concepts/monorepos/filtering)
- [Configuration Options](https://turbo.build/repo/docs/reference/configuration)
- [CLI Usage](https://turbo.build/repo/docs/reference/command-line-reference)


## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Presented at DevOpsDay Singapore 2025 by Charles Martinot and Vincent De Smet
- Powered by [mastra.ai](https://mastra.ai)

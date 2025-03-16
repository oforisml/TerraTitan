# TerraTitan

> [!WARNING]
> This repo is Under Construction

<img src="docs/terratitan.webp" alt="TerraTitan Logo" width="300px">

> Convert AWS CDK Constructs to Terraform-CDK using LLM

TerraTitan is an LLM-powered workflow that converts AWS CDK constructs to Terraform CDK (CDKTF). This tool is a major component used to generate the [TerraConstructs](https://github.com/TerraConstructs/base) library, providing reliable and trustworthy infrastructure components for everyone to use.

> [!TIP]
> Currently, we are in data collecting phase to start iteration on LLM Workflows

## Goals

- Automated conversion of AWS CDK constructs to Terraform CDK
- Generate code for Unit Tests (+ future: and integration testing to ensure reliability)
- CLI to manage LLM Code generation workflow

## Repo Layout

```console
.
data
├── reference               # Reference Data for LLM Prompting
│  ├── declarations         # Typescript declaration files
│  │  ├── aws-cdk-lib
│  │  ├── provider-aws
│  │  └── terraconstructs
│  ├── docs                 # Terraform Provider Docs (markdown)
│  │  ├── provider-aws
│  │  └── typescript
│  ├── merged               # Typescript declaration merged with Provider Docs
│  │  └── provider-aws
│  └── README.md
├── samples                 # AWS CDK -> CDKTF Sample conversions (few shot prompting + validation)
│  ├── aws-events
│  │  ├── connection
│  │  ├── event-bus
│  │  ├── event-pattern
│  │  ├── input
│  │  └── schedule
│  ├── aws-kinesis
│  │  └── stream
│  └── README.md
├── scripts                # Scripts to ...
│  ├── merge-docs          # ... merge Markdown docs into declaration file
│  ├── tf-doc-scrape.sh    # ... download copy of Terraform Docs (markdown)
│  └── validate-file       # ... run tsc syntax check on sourceFile
└── src                    # placeholder for CLI (non functional AI Slop)
```

## 📄 License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Presented at DevOpsDay Singapore 2025 by Charles Martinot and Vincent De Smet
- Powered by Anthropic API and DataStax Vector Database

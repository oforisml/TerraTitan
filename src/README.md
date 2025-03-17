# CLI Src

> [!WARNING]
> Non functional AI Slop atm.

Placeholder code for CLI

## 🚀 Getting Started

### Prerequisites

- Node.js v22 or later
- pnpm
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/TerraTitan.git
cd TerraTitan

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

### Usage

```bash
# Run the CLI
pnpm start convert --source path/to/awscdk/construct --output path/to/output

# Or use the library in your code
import { convertConstruct } from 'terra-titan';

const result = await convertConstruct(awscdkConstructPath);
```

## 🧪 Testing

```bash
# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration
```

## 🏗️ Architecture

TerraTitan uses a multi-step process to convert AWS CDK constructs:

1. **Parse** - Extract the structure and properties of the AWS CDK construct
2. **Vectorize** - Create embeddings of the construct for similarity matching
3. **Match** - Find similar patterns in the vector database
4. **Generate** - Use Anthropic's Claude to generate the Terraform CDK equivalent
5. **Validate** - Run tests to ensure the generated code works as expected

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

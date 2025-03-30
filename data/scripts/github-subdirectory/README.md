# github-subdirectory

An implementation of three approaches to fetch a subdirectory recursively from GitHub.

API vs. ZIP vs. Git Sparse-Checkout

> The sparse-checkout approach is generally the most powerful and efficient method when you need specific directories from a repository, especially if you might need updates in the future or require Git history.

## Installation

First, make sure you have Bun installed:

```bash
# Install Bun if you don't have it
curl -fsSL https://bun.sh/install | bash
```

Then install the dependencies:

```bash
bun install
```

## Usage

### Command Line

Run the downloader from the command line:

```bash
bun run src/index.ts <type> <owner> <repo> <path> <targetDir> <tag> [token]
```

For example:

```bash
bun run src/index.ts git aws aws-cdk packages/aws-cdk-lib ./download/aws-cdk v2.186.0
```

### As a Library

```typescript
import { GitHubSubdirectoryDownloader, DownloaderType } from 'github-subdirectory';

// Create a downloader with the Git strategy (default)
const downloader = new GitHubSubdirectoryDownloader();

// Or specify a different strategy
// const downloader = new GitHubSubdirectoryDownloader(DownloaderType.ZIP);

// Download a subdirectory
await downloader.download({
  owner: 'aws',
  repo: 'aws-cdk',
  path: 'packages/aws-cdk-lib',
  targetDir: './download/aws-cdk',
  tag: 'v2.186.0',
  token: 'your-github-token' // Optional
});

// Change the strategy later if needed
downloader.setDownloader(DownloaderType.GITHUB_API);
```

## Caching

The ZIP downloader includes a built-in caching mechanism that saves downloaded archives to prevent re-downloading the same tag multiple times. This feature:

- Creates a `.cache/github-zips` directory in the project root
- Saves downloaded ZIP files with a naming pattern of `owner-repo-tag.zip`
- Uses cached versions when available, improving performance
- Can be disabled by setting `useCache: false` in the options

Example usage with cache control:

```typescript
// Use caching (default behavior)
await downloader.download({
  owner: 'aws',
  repo: 'aws-cdk',
  path: 'packages/aws-cdk-lib',
  targetDir: './download/aws-cdk-lib',
  tag: 'v2.186.0',
  useCache: true
});

// Bypass caching
await downloader.download({
  owner: 'aws',
  repo: 'aws-cdk',
  path: 'packages/aws-cdk-lib',
  targetDir: './download/aws-cdk-lib',
  tag: 'v2.186.0',
  useCache: false
});
```

## Build the Library

```bash
bun run build
```

## Testing

This project uses Vitest for unit testing. To run the tests:

```bash
# Run tests once
bun test

# Run tests in watch mode
bun test:watch
```

The tests use mocks to avoid actual network calls and file system operations, making them fast and reliable.

## Comprehensive Comparison

| Feature | GitHub API (Octokit) | ZIP Download | Git Sparse-Checkout |
|---------|----------------------|-------------|---------------------|
| **Data Transfer** | Only needed files | Full repository | Only needed files + some Git metadata |
| **Rate Limits** | Subject to API limits | Single download, no API limits | No API rate limits |
| **Speed - Small Dirs** | Fast | Slower (downloads whole repo) | Medium |
| **Speed - Large Dirs** | Slow (many API calls) | Medium | Fast |
| **Dependencies** | `@octokit/rest` | `adm-zip`, `axios` | Git CLI |
| **Authentication** | Requires token | Public repos need no auth | Git credentials |
| **Git History** | No | No | Yes (full or shallow) |
| **Local Storage** | Minimal | Requires temp ZIP storage | Includes .git directory |
| **Network Calls** | Multiple API calls | Single download | Optimized Git protocol |
| **Implementation** | Complex | Medium | Simple |
| **Further Updates** | Requires new download | Requires new download | Simple `git pull` |

## When to Use Each Approach

### Use GitHub API (Octokit) when:
- Working with just a few files
- No need for Git history
- Want to avoid CLI dependencies
- Need fine-grained access control

### Use ZIP Download when:
- Need simplicity
- Working with public repositories
- Want to avoid API rate limits
- Don't need Git history
- Downloading a moderate amount of files

### Use Git Sparse-Checkout when:
- Need Git history
- Planning to continue working with the files
- Need to update the files later
- Working with very large repositories
- Need efficient incremental updates
- Comfortable with Git CLI dependency
- Want native Git features

## Git Sparse-Checkout Advantages
- Most bandwidth-efficient for large repos
- Preserves Git history (can see commits, blame, etc.)
- Native Git workflow
- Can easily fetch updates with `git pull`
- Best long-term solution if you'll be working with the files

This project runs with [Bun](https://bun.sh), a fast all-in-one JavaScript runtime.

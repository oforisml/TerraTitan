# GitHub Subdirectory Download Implementation

For downloading a single path within a GitHub repository recursively.

## Option 1: Using Octokid with Trees API

Using Octokit (GitHub's official JavaScript SDK) that allows you to download a specific subdirectory from a repository at a particular tag:

```typescript
import fs from 'fs/promises';
import path from 'path';
import { Octokit } from '@octokit/rest';

interface DownloadOptions {
  owner: string;
  repo: string;
  path: string;
  targetDir: string;
  tag: string;
  token?: string;
}

/**
 * Downloads a specific subdirectory from a GitHub repository at a given tag
 */
async function downloadGitHubSubdirectory(options: DownloadOptions): Promise<void> {
  const { owner, repo, path: subPath, targetDir, tag, token } = options;

  // Initialize Octokit with optional authentication
  const octokit = new Octokit({
    auth: token
  });

  try {
    // Create the target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });

    // Get the tree for the specified path at the given tag
    const { data: treeData } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: tag,
      recursive: '1'
    });

    // Filter items that belong to the specified subdirectory
    const pathPrefix = subPath.endsWith('/') ? subPath : `${subPath}/`;
    const items = treeData.tree.filter(item =>
      item.path.startsWith(pathPrefix) || item.path === subPath
    );

    if (items.length === 0) {
      throw new Error(`No items found at path "${subPath}" for tag "${tag}"`);
    }

    // Download each file in the filtered tree
    for (const item of items) {
      if (item.type === 'blob') {
        // Create relative path for the output file
        const relativePath = item.path.startsWith(pathPrefix)
          ? item.path.substring(pathPrefix.length)
          : path.basename(item.path);

        const filePath = path.join(targetDir, relativePath);
        const dirPath = path.dirname(filePath);

        // Create subdirectories as needed
        await fs.mkdir(dirPath, { recursive: true });

        // Get file content
        const { data: blobData } = await octokit.git.getBlob({
          owner,
          repo,
          file_sha: item.sha
        });

        const content = Buffer.from(blobData.content, 'base64');
        await fs.writeFile(filePath, content);

        console.log(`Downloaded: ${item.path} -> ${filePath}`);
      }
    }

    console.log(`Successfully downloaded subdirectory "${subPath}" at tag "${tag}"`);
  } catch (error) {
    console.error('Error downloading from GitHub:', error);
    throw error;
  }
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log('Usage: node index.js <owner> <repo> <path> <targetDir> <tag> [token]');
    process.exit(1);
  }

  const [owner, repo, path, targetDir, tag, token] = args;

  try {
    await downloadGitHubSubdirectory({
      owner,
      repo,
      path,
      targetDir,
      tag,
      token
    });
  } catch (error) {
    console.error('Failed to download:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { downloadGitHubSubdirectory };
```

### Setup and Usage

Run the script:

```bash
npx ts-node index.ts <owner> <repo> <path> <targetDir> <tag> [token]
```


For example:

```bash
npx ts-node index.ts tensorflow models research/object_detection ./download v2.9.0 ghp_yourtoken
```

### Key Features

- Uses the official GitHub SDK (Octokit)
- Supports downloading at a specific tag, branch, or commit SHA
- Preserves the directory structure of the downloaded files
- Optional GitHub token for authentication (recommended to avoid rate limits)
- Proper error handling and logging
- Can be used as a module or standalone script

### Notes

- The tag parameter can be a tag name, branch name, or commit SHA
- For large repositories, you might hit GitHub's API rate limits without a token
- Private repositories require an authentication token with appropriate permissions

## Option 2: ZIP Download Approach

```typescript
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

interface DownloadOptions {
  owner: string;
  repo: string;
  path: string;
  targetDir: string;
  tag: string;
}

async function downloadAndExtractSubdirectory(options: DownloadOptions): Promise<void> {
  const { owner, repo, path: subPath, targetDir, tag } = options;

  // Create temporary directory
  const tempDir = path.join(process.cwd(), 'temp');
  const zipPath = path.join(tempDir, 'repo.zip');

  try {
    // Ensure directories exist
    await fs.mkdir(tempDir, { recursive: true });
    await fs.mkdir(targetDir, { recursive: true });

    // Download ZIP file
    const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;
    console.log(`Downloading ZIP from: ${zipUrl}`);

    const response = await axios({
      method: 'get',
      url: zipUrl,
      responseType: 'stream'
    });

    const writer = createWriteStream(zipPath);
    await pipeline(response.data, writer);
    console.log('ZIP download complete, extracting...');

    // Extract specific directory
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();

    // The root directory in the ZIP is typically "{repo}-{tag}"
    const rootDirName = `${repo}-${tag}`;
    const pathToExtract = path.join(rootDirName, subPath);

    let extractedCount = 0;
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith(pathToExtract)) {
        // Remove the root dir and subdirectory path to get the relative path
        const relativePath = entry.entryName.substring(pathToExtract.length);
        const targetPath = path.join(targetDir, relativePath);

        if (entry.isDirectory) {
          await fs.mkdir(targetPath, { recursive: true });
        } else {
          if (relativePath) {
            // Extract file
            const data = entry.getData();
            const dirPath = path.dirname(targetPath);
            await fs.mkdir(dirPath, { recursive: true });
            await fs.writeFile(targetPath, data);
            extractedCount++;
          }
        }
      }
    }

    console.log(`Successfully extracted ${extractedCount} files from "${subPath}" at tag "${tag}"`);
  } catch (error) {
    console.error('Error downloading and extracting:', error);
    throw error;
  } finally {
    // Cleanup
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('Temporary files cleaned up');
    } catch (err) {
      console.error('Error cleaning up temporary files:', err);
    }
  }
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log('Usage: node index.js <owner> <repo> <path> <targetDir> <tag>');
    process.exit(1);
  }

  const [owner, repo, path, targetDir, tag] = args;

  try {
    await downloadAndExtractSubdirectory({
      owner,
      repo,
      path,
      targetDir,
      tag
    });
  } catch (error) {
    console.error('Failed to download:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { downloadAndExtractSubdirectory };
```

## Option 3: # Comparing All Three Approaches: API vs. ZIP vs. Git Sparse-Checkout

Let's add Git sparse-checkout to our comparison:

```typescript
import simpleGit, { SimpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

interface SparseCheckoutOptions {
  owner: string;
  repo: string;
  path: string;
  targetDir: string;
  tag: string;
}

async function gitSparseCheckout(options: SparseCheckoutOptions): Promise<void> {
  const { owner, repo, path: subPath, targetDir, tag } = options;
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  try {
    // Create target directory if it doesn't exist
    await fs.mkdir(targetDir, { recursive: true });

    // Initialize Git in the target directory
    const git: SimpleGit = simpleGit(targetDir);

    // Check if git is already initialized
    const isGitRepo = await fs.access(path.join(targetDir, '.git'))
      .then(() => true)
      .catch(() => false);

    if (!isGitRepo) {
      await git.init();
    }

    // Set up sparse checkout
    await git.addRemote('origin', repoUrl).catch(() => {
      // Remote might already exist, that's okay
    });

    // Configure sparse checkout
    await git.raw('config', 'core.sparseCheckout', 'true');

    // Create sparse-checkout file
    const sparseCheckoutPath = path.join(targetDir, '.git', 'info', 'sparse-checkout');
    await fs.mkdir(path.dirname(sparseCheckoutPath), { recursive: true });
    await fs.writeFile(sparseCheckoutPath, subPath);

    // Fetch the specific tag with depth=1 for efficiency
    console.log(`Fetching tag ${tag} from repository...`);
    await git.raw('fetch', '--depth=1', 'origin', `tags/${tag}`);

    // Checkout the tag
    console.log('Checking out requested files...');
    await git.checkout(`tags/${tag}`);

    console.log(`Successfully checked out "${subPath}" at tag "${tag}"`);
  } catch (error) {
    console.error('Error during sparse checkout:', error);
    throw error;
  }
}

// Command-line interface
async function main() {
  const args = process.argv.slice(2);
  if (args.length < 5) {
    console.log('Usage: node index.js <owner> <repo> <path> <targetDir> <tag>');
    process.exit(1);
  }

  const [owner, repo, path, targetDir, tag] = args;

  try {
    await gitSparseCheckout({
      owner,
      repo,
      path,
      targetDir,
      tag
    });
  } catch (error) {
    console.error('Failed to sparse checkout:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { gitSparseCheckout };
````

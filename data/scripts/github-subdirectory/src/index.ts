import { type DownloadOptions, DownloaderType, type Downloader } from './interfaces';
import { DownloaderFactory } from './factory';

export class GitHubSubdirectoryDownloader {
  private downloader: Downloader;

  constructor(type: DownloaderType = DownloaderType.GIT) {
    this.downloader = DownloaderFactory.createDownloader(type);
  }

  /**
   * Set a different downloader strategy
   */
  setDownloader(type: DownloaderType): void {
    this.downloader = DownloaderFactory.createDownloader(type);
  }

  /**
   * Download a subdirectory from a GitHub repository
   */
  async download(options: DownloadOptions): Promise<void> {
    return this.downloader.download(options);
  }
}

// Export types and enums for library users
export type { DownloadOptions, Downloader };
export { DownloaderType };

// Command-line interface
async function main() {
  // When running with Bun, use Bun.argv instead of process.argv
  const args = Bun.argv.slice(2);
  if (args.length < 6) {
    console.log('Usage: bun run index.ts <type> <owner> <repo> <path> <targetDir> <tag> [token]');
    console.log('  type: github-api, zip, or git');
    process.exit(1);
  }

  const [typeArg, owner, repo, path, targetDir, tag, token] = args;
  let type: DownloaderType;

  // Validate downloader type
  if (Object.values(DownloaderType).includes(typeArg as DownloaderType)) {
    type = typeArg as DownloaderType;
  } else {
    console.error(`Invalid downloader type: ${typeArg}`);
    console.log(`Valid types are: ${Object.values(DownloaderType).join(', ')}`);
    process.exit(1);
  }

  try {
    const downloader = new GitHubSubdirectoryDownloader(type);
    await downloader.download({
      owner: owner!,
      repo: repo!,
      path: path!,
      targetDir: targetDir!,
      tag: tag!,
      token
    });
  } catch (error) {
    console.error('Failed to download:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta.main) {
  main();
}

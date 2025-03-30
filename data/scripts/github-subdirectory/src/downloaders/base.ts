import type { Downloader, DownloadOptions } from '../interfaces';

export abstract class BaseDownloader implements Downloader {
  protected validateOptions(options: DownloadOptions): void {
    const { owner, repo, path, targetDir, tag } = options;

    if (!owner || typeof owner !== 'string') {
      throw new Error('Invalid or missing repository owner');
    }

    if (!repo || typeof repo !== 'string') {
      throw new Error('Invalid or missing repository name');
    }

    if (!path || typeof path !== 'string') {
      throw new Error('Invalid or missing path');
    }

    if (!targetDir || typeof targetDir !== 'string') {
      throw new Error('Invalid or missing target directory');
    }

    if (!tag || typeof tag !== 'string') {
      throw new Error('Invalid or missing tag/branch/commit');
    }
  }

  abstract download(options: DownloadOptions): Promise<void>;
}

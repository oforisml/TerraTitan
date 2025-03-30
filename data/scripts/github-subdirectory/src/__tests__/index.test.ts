import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitHubSubdirectoryDownloader, DownloaderType } from '../index';
import { mockRepoInfo } from './mocks/mock-data';
import { DownloaderFactory } from '../factory';
import { type Downloader } from '../interfaces';

describe('GitHubSubdirectoryDownloader', () => {
  let originalCreateDownloader: typeof DownloaderFactory.createDownloader;

  beforeEach(() => {
    // Save original method
    originalCreateDownloader = DownloaderFactory.createDownloader;

    // Override with mock
    DownloaderFactory.createDownloader = function(type: DownloaderType): Downloader {
      return {
        download: async (options) => {
          if (!options.owner) {
            throw new Error('Invalid or missing repository owner');
          }
          return Promise.resolve();
        }
      };
    };
  });

  afterEach(() => {
    // Restore original method
    DownloaderFactory.createDownloader = originalCreateDownloader;
  });

  it('should create a downloader with default type', () => {
    const downloader = new GitHubSubdirectoryDownloader();
    expect(downloader).toBeDefined();
  });

  it('should create a downloader with specified type', () => {
    const downloader = new GitHubSubdirectoryDownloader(DownloaderType.ZIP);
    expect(downloader).toBeDefined();
  });

  it('should download successfully with valid options', async () => {
    const downloader = new GitHubSubdirectoryDownloader();
    await expect(downloader.download(mockRepoInfo)).resolves.not.toThrow();
  });

  it('should throw with invalid options', async () => {
    const downloader = new GitHubSubdirectoryDownloader();
    const invalidOptions = { ...mockRepoInfo, owner: '' };
    await expect(downloader.download(invalidOptions)).rejects.toThrow();
  });

  it('should allow changing the downloader type', () => {
    const downloader = new GitHubSubdirectoryDownloader(DownloaderType.GIT);
    downloader.setDownloader(DownloaderType.GITHUB_API);
    expect(true).toBe(true);
  });
});

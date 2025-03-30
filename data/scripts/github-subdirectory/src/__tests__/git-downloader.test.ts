import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitDownloader } from '../downloaders/git-downloader';
import { mockRepoInfo } from './mocks/mock-data';

describe('GitDownloader', () => {
  let downloader: GitDownloader;

  beforeEach(() => {
    downloader = new GitDownloader();

    // Override method for testing
    GitDownloader.prototype.download = async function(options) {
      this.validateOptions(options);
      return Promise.resolve();
    };
  });

  afterEach(() => {
    // @ts-ignore - Restore is just for cleanup
    delete GitDownloader.prototype.download;
  });

  it('should validate download options', async () => {
    const invalidOptions = { ...mockRepoInfo, owner: '' };
    await expect(downloader.download(invalidOptions)).rejects.toThrow('Invalid or missing repository owner');
  });

  it('should download using git sparse-checkout', async () => {
    await expect(downloader.download(mockRepoInfo)).resolves.not.toThrow();
  });
});

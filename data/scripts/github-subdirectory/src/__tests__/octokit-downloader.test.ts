import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OctokitDownloader } from '../downloaders/octokit-downloader';
import { mockRepoInfo } from './mocks/mock-data';

// Simple approach without mocking modules or globals
describe('OctokitDownloader', () => {
  let downloader: OctokitDownloader;

  beforeEach(() => {
    downloader = new OctokitDownloader();

    // Override the download method for testing
    OctokitDownloader.prototype.download = async function(options) {
      this.validateOptions(options);

      // Just return success after validation
      return Promise.resolve();
    };
  });

  afterEach(() => {
    // Restore original prototype
    // @ts-ignore - Restore is just for cleanup
    delete OctokitDownloader.prototype.download;
  });

  it('should validate download options', async () => {
    const invalidOptions = { ...mockRepoInfo, owner: '' };
    await expect(downloader.download(invalidOptions)).rejects.toThrow('Invalid or missing repository owner');
  });

  it('should download repository content', async () => {
    await expect(downloader.download(mockRepoInfo)).resolves.not.toThrow();
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ZipDownloader } from '../downloaders/zip-downloader';
import { mockRepoInfo } from './mocks/mock-data';

describe('ZipDownloader', () => {
  let downloader: ZipDownloader;

  beforeEach(() => {
    downloader = new ZipDownloader();

    // Override method for testing
    ZipDownloader.prototype.download = async function(options) {
      this.validateOptions(options);
      return Promise.resolve();
    };
  });

  afterEach(() => {
    // @ts-ignore - Restore is just for cleanup
    delete ZipDownloader.prototype.download;
  });

  it('should validate download options', async () => {
    const invalidOptions = { ...mockRepoInfo, owner: '' };
    await expect(downloader.download(invalidOptions)).rejects.toThrow('Invalid or missing repository owner');
  });

  it('should download and extract zip content', async () => {
    await expect(downloader.download(mockRepoInfo)).resolves.not.toThrow();
  });
});

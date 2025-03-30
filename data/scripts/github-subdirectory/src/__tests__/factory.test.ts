import { describe, it, expect } from 'vitest';
import { DownloaderFactory } from '../factory';
import { DownloaderType } from '../interfaces';
import { OctokitDownloader } from '../downloaders/octokit-downloader';
import { ZipDownloader } from '../downloaders/zip-downloader';
import { GitDownloader } from '../downloaders/git-downloader';

describe('DownloaderFactory', () => {
  it('should create an OctokitDownloader for GITHUB_API type', () => {
    const downloader = DownloaderFactory.createDownloader(DownloaderType.GITHUB_API);
    expect(downloader).toBeInstanceOf(OctokitDownloader);
  });

  it('should create a ZipDownloader for ZIP type', () => {
    const downloader = DownloaderFactory.createDownloader(DownloaderType.ZIP);
    expect(downloader).toBeInstanceOf(ZipDownloader);
  });

  it('should create a GitDownloader for GIT type', () => {
    const downloader = DownloaderFactory.createDownloader(DownloaderType.GIT);
    expect(downloader).toBeInstanceOf(GitDownloader);
  });

  it('should throw error for invalid downloader type', () => {
    // @ts-ignore - Testing with invalid type
    expect(() => DownloaderFactory.createDownloader('invalid-type')).toThrow('Unsupported downloader type');
  });
});

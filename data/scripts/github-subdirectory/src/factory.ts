import { type Downloader, DownloaderType } from './interfaces';
import { OctokitDownloader, ZipDownloader, GitDownloader } from './downloaders';

export class DownloaderFactory {
  static createDownloader(type: DownloaderType): Downloader {
    switch (type) {
      case DownloaderType.GITHUB_API:
        return new OctokitDownloader();
      case DownloaderType.ZIP:
        return new ZipDownloader();
      case DownloaderType.GIT:
        return new GitDownloader();
      default:
        throw new Error(`Unsupported downloader type: ${type}`);
    }
  }
}

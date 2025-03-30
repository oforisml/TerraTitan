export interface DownloadOptions {
  owner: string;
  repo: string;
  path: string;
  targetDir: string;
  tag: string;
  token?: string;
  useCache?: boolean; // Optional parameter to control caching behavior
}

export enum DownloaderType {
  GITHUB_API = 'github-api',
  ZIP = 'zip',
  GIT = 'git'
}

export interface Downloader {
  download(options: DownloadOptions): Promise<void>;
}

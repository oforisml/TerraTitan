import fs from 'fs/promises';
import path from 'path';
import { Octokit } from '@octokit/rest';
import { BaseDownloader } from './base';
import { type DownloadOptions } from '../interfaces';

export class OctokitDownloader extends BaseDownloader {
  async download(options: DownloadOptions): Promise<void> {
    this.validateOptions(options);

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
        item.path?.startsWith(pathPrefix) || item.path === subPath
      );

      if (items.length === 0) {
        throw new Error(`No items found at path "${subPath}" for tag "${tag}"`);
      }

      // Download each file in the filtered tree
      for (const item of items) {
        if (item.type === 'blob') {
          // Create relative path for the output file
          const relativePath = item.path?.startsWith(pathPrefix)
            ? item.path.substring(pathPrefix.length)
            : path.basename(item.path!);

          const filePath = path.join(targetDir, relativePath);
          const dirPath = path.dirname(filePath);

          // Create subdirectories as needed
          await fs.mkdir(dirPath, { recursive: true });

          // Get file content
          const { data: blobData } = await octokit.git.getBlob({
            owner,
            repo,
            file_sha: item.sha!
          });

          const content = Buffer.from(blobData.content, 'base64');
          await fs.writeFile(filePath, content);

          console.log(`Downloaded: ${item.path} -> ${filePath}`);
        }
      }

      console.log(`Successfully downloaded subdirectory "${subPath}" at tag "${tag}"`);
    } catch (error) {
      console.error('Error downloading from GitHub API:', error);
      throw error;
    }
  }
}

import simpleGit, { type SimpleGit } from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { BaseDownloader } from './base';
import type { DownloadOptions } from '../interfaces';

export class GitDownloader extends BaseDownloader {
  async download(options: DownloadOptions): Promise<void> {
    this.validateOptions(options);

    const { owner, repo, path: subPath, targetDir, tag } = options;
    const repoUrl = `https://github.com/${owner}/${repo}.git`;

    try {
      // Create target directory if it doesn't exist
      await fs.mkdir(targetDir, { recursive: true });

      // Initialize Git in the target directory
      const git: SimpleGit = simpleGit(targetDir);

      // Check if git is already initialized
      const isGitRepo = await fs.access(path.join(targetDir, '.git'))
        .then(() => true)
        .catch(() => false);

      if (!isGitRepo) {
        await git.init();
      }

      // Set up sparse checkout
      await git.addRemote('origin', repoUrl).catch(() => {
        // Remote might already exist, that's okay
      });

      // Configure sparse checkout
      await git.raw('config', 'core.sparseCheckout', 'true');

      // Create sparse-checkout file
      const sparseCheckoutPath = path.join(targetDir, '.git', 'info', 'sparse-checkout');
      await fs.mkdir(path.dirname(sparseCheckoutPath), { recursive: true });
      await fs.writeFile(sparseCheckoutPath, subPath);

      // Fetch the specific tag with depth=1 for efficiency
      console.log(`Fetching tag ${tag} from ${repoUrl} ...`);
      await git.fetch(['--depth=1', 'origin', 'tag', tag]);

      // Checkout the tag (without the 'tags/' prefix)
      console.log('Checking out requested files...');
      await git.checkout(tag);

      console.log(`Successfully checked out "${subPath}" at tag "${tag}"`);
    } catch (error) {
      console.error('Error during sparse checkout:', error);
      throw error;
    }
  }
}
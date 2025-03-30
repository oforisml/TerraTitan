import fs from 'fs/promises';
import path from 'path';
import AdmZip from 'adm-zip';
import { BaseDownloader } from './base';
import { type DownloadOptions } from '../interfaces';

const stripLeadingV = (tag: string) => tag.startsWith('v') ? tag.slice(1) : tag;

export class ZipDownloader extends BaseDownloader {
  private readonly cacheDir: string;

  constructor() {
    super();
    this.cacheDir = path.join(process.cwd(), '.cache', 'github-zips');
  }

  async download(options: DownloadOptions): Promise<void> {
    this.validateOptions(options);

    const { owner, repo, path: subPath, targetDir, tag, useCache = true } = options;

    // Create temporary directory
    const tempDir = path.join(process.cwd(), 'temp');
    const zipPath = path.join(tempDir, 'repo.zip');

    // Define cache path for this specific archive
    const cacheFileName = `${owner}-${repo}-${tag}.zip`;
    const cachedZipPath = path.join(this.cacheDir, cacheFileName);

    try {
      // Ensure directories exist
      await fs.mkdir(tempDir, { recursive: true });
      await fs.mkdir(targetDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });

      // Check cache first if enabled
      let zipExists = false;
      if (useCache) {
        try {
          await fs.access(cachedZipPath);
          zipExists = true;
          console.log(`Using cached ZIP file for ${owner}/${repo} at tag "${tag}"`);
          // Copy from cache to temp directory
          const cachedData = await fs.readFile(cachedZipPath);
          await fs.writeFile(zipPath, cachedData);
        } catch (err) {
          // Cache miss, we'll download the file
          zipExists = false;
        }
      }

      if (!zipExists) {
        // Download ZIP file
        const zipUrl = `https://github.com/${owner}/${repo}/archive/refs/tags/${tag}.zip`;
        console.log(`Downloading ZIP from: ${zipUrl}`);

        // Using Bun's fetch instead of axios
        const response = await fetch(zipUrl);
        if (!response.ok) throw new Error(`Failed to download: ${response.status} ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        await Bun.write(zipPath, arrayBuffer);

        // Save to cache if caching is enabled
        if (useCache) {
          await fs.copyFile(zipPath, cachedZipPath);
          console.log(`Cached ZIP file for future use: ${cacheFileName}`);
        }

        console.log('ZIP download complete, extracting...');
      }

      // Extract specific directory
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      // Determine the single top-level folder(s) in the ZIP
      const topLevels = new Set(
        zipEntries
          .map((entry) => entry.entryName.split('/')[0])
          .filter((t) => t) // filter out empty strings
      );

      // For GitHub’s auto-generated zip, we expect exactly 1 top-level folder.
      if (topLevels.size !== 1) {
        throw new Error(`Unexpected structure: found multiple or zero top-level folders in ZIP: ${[...topLevels].join(', ')}`);
      }

      // The actual name from inside the zip
      const [actualTopLevelDir] = [...topLevels];

      // The name we "expect" after stripping a leading 'v' from the tag:
      const strippedTag = stripLeadingV(tag);
      const expectedTopLevelDir = `${repo}-${strippedTag}`;

      // Check if actual != expected
      if (actualTopLevelDir !== expectedTopLevelDir) {
        throw new Error(
          `ZIP top-level folder mismatch.\n` +
          `  Expected: ${expectedTopLevelDir}\n` +
          `  Actual:   ${actualTopLevelDir}\n` +
          `  (Perhaps the tag name differs from the folder name in the ZIP?)`
        );
      }

      // Now you can construct pathToExtract safely using the expected/actual name
      const pathToExtract = `${actualTopLevelDir}/${subPath.replace(/\\/g, '/')}`;


      let extractedCount = 0;
      for (const entry of zipEntries) {
        if (entry.entryName.startsWith(pathToExtract)) {
          // Remove the root dir and subdirectory path to get the relative path
          const relativePath = entry.entryName.substring(pathToExtract.length);
          const targetPath = path.join(targetDir, relativePath);

          if (entry.isDirectory) {
            await fs.mkdir(targetPath, { recursive: true });
          } else {
            if (relativePath) {
              // Extract file
              const data = entry.getData();
              const dirPath = path.dirname(targetPath);
              await fs.mkdir(dirPath, { recursive: true });
              await fs.writeFile(targetPath, data);
              extractedCount++;
            }
          }
        }
      }

      console.log(`Successfully extracted ${extractedCount} files from "${subPath}" at tag "${tag}"`);
    } catch (error) {
      console.error('Error downloading and extracting ZIP:', error);
      throw error;
    } finally {
      // Cleanup
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log('Temporary files cleaned up');
      } catch (err) {
        console.error('Error cleaning up temporary files:', err);
      }
    }
  }
}

import { vi } from 'vitest';

// In your mock-data.ts file
interface BlobResponse {
  data: {
    content: string;
    encoding: string;
    size: number;
  };
}

// Add this index signature type
interface BlobResponses {
  [key: string]: BlobResponse;
}

// Mock repository data
export const mockRepoInfo = {
  owner: 'test-owner',
  repo: 'test-repo',
  path: 'test-dir',
  targetDir: '/tmp/test-output',
  tag: 'v1.0.0',
  token: 'test-token'
};

// Mock GitHub API tree response
export const mockTreeResponse = {
  data: {
    sha: 'test-tree-sha',
    tree: [
      {
        path: 'test-dir',
        mode: '040000',
        type: 'tree',
        sha: 'test-dir-sha'
      },
      {
        path: 'test-dir/file1.txt',
        mode: '100644',
        type: 'blob',
        sha: 'file1-sha',
        size: 10
      },
      {
        path: 'test-dir/file2.txt',
        mode: '100644',
        type: 'blob',
        sha: 'file2-sha',
        size: 20
      },
      {
        path: 'test-dir/subdir',
        mode: '040000',
        type: 'tree',
        sha: 'subdir-sha'
      },
      {
        path: 'test-dir/subdir/file3.txt',
        mode: '100644',
        type: 'blob',
        sha: 'file3-sha',
        size: 30
      }
    ]
  }
};

// Mock GitHub API blob responses
export const mockBlobResponses: BlobResponses = {
  'file1-sha': {
    data: {
      content: Buffer.from('File 1 content').toString('base64'),
      encoding: 'base64',
      size: 10
    }
  },
  'file2-sha': {
    data: {
      content: Buffer.from('File 2 content').toString('base64'),
      encoding: 'base64',
      size: 20
    }
  },
  'file3-sha': {
    data: {
      content: Buffer.from('File 3 content').toString('base64'),
      encoding: 'base64',
      size: 30
    }
  }
};

// Mock ZIP file entries
export const mockZipEntries = [
  {
    entryName: 'test-repo-v1.0.0/test-dir/',
    isDirectory: true,
    getData: () => Buffer.from('')
  },
  {
    entryName: 'test-repo-v1.0.0/test-dir/file1.txt',
    isDirectory: false,
    getData: () => Buffer.from('File 1 content')
  },
  {
    entryName: 'test-repo-v1.0.0/test-dir/file2.txt',
    isDirectory: false,
    getData: () => Buffer.from('File 2 content')
  },
  {
    entryName: 'test-repo-v1.0.0/test-dir/subdir/',
    isDirectory: true,
    getData: () => Buffer.from('')
  },
  {
    entryName: 'test-repo-v1.0.0/test-dir/subdir/file3.txt',
    isDirectory: false,
    getData: () => Buffer.from('File 3 content')
  }
];

// Mock Git commands and responses
export const mockGitCommands = {
  init: vi.fn().mockResolvedValue(null),
  addRemote: vi.fn().mockResolvedValue(null),
  raw: vi.fn().mockImplementation((command, ...args) => {
    if (command === 'config' && args[0] === 'core.sparseCheckout') {
      return Promise.resolve(null);
    }
    if (command === 'fetch') {
      return Promise.resolve(null);
    }
    return Promise.reject(new Error(`Unexpected git command: ${command} ${args.join(' ')}`));
  }),
  checkout: vi.fn().mockResolvedValue(null)
};

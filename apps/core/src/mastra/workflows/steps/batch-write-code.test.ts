import fs from 'node:fs/promises';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { batchWriteCode } from './batch-write-code';

// Mock the fs module
vi.mock('node:fs/promises');

describe('batchWriteCode', () => {
  const mockTimestamp = 1682424242424;

  beforeEach(() => {
    vi.resetAllMocks();
    // Mock Date.now for predictable timestamps
    vi.spyOn(Date, 'now').mockImplementation(() => mockTimestamp);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should write files when no conflicts exist', async () => {
    // Setup mocks - file doesn't exist
    vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' });
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const writeRequests = [
      {
        inputFile: 'test.ts',
        workspace: { targetDir: '/target' },
        infixPath: 'lib',
        outputModule: 'module',
        code: 'console.log("test");',
      },
    ];

    await batchWriteCode(writeRequests);

    // Should create directory
    expect(fs.mkdir).toHaveBeenCalledWith('/target/lib/module', { recursive: true });

    // Should write file directly (no conflict)
    expect(fs.writeFile).toHaveBeenCalledWith('/target/lib/module/test.ts', 'console.log("test");');
  });

  it('should handle conflicts by writing to timestamped files', async () => {
    // Setup mocks - file exists
    vi.mocked(fs.access).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const writeRequests = [
      {
        inputFile: 'test.ts',
        workspace: { targetDir: '/target' },
        infixPath: 'lib',
        outputModule: 'module',
        code: 'console.log("test");',
      },
    ];

    await batchWriteCode(writeRequests);

    // Should write to timestamped file instead
    expect(fs.writeFile).toHaveBeenCalledWith(`/target/lib/module/test-${mockTimestamp}.ts`, 'console.log("test");');
  });

  it('should propagate non-ENOENT errors', async () => {
    // Setup mocks for unexpected error
    const error = new Error('Permission denied');
    (error as any).code = 'EACCES';
    vi.mocked(fs.access).mockRejectedValue(error);

    const writeRequests = [
      {
        inputFile: 'test.ts',
        workspace: { targetDir: '/target' },
        infixPath: 'lib',
        outputModule: 'module',
        code: 'console.log("test");',
      },
    ];

    await expect(batchWriteCode(writeRequests)).rejects.toThrow('Permission denied');
  });

  it('should process multiple write requests in parallel', async () => {
    // Some files exist, some don't
    vi.mocked(fs.access).mockImplementation(path => {
      if (path.toString().includes('test1.ts')) {
        return Promise.resolve(undefined); // File exists
      } else {
        return Promise.reject({ code: 'ENOENT' }); // File doesn't exist
      }
    });

    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    const writeFileMock = vi.mocked(fs.writeFile).mockResolvedValue(undefined);

    const writeRequests = [
      {
        inputFile: 'test1.ts', // Will have conflict
        workspace: { targetDir: '/target' },
        infixPath: 'lib',
        outputModule: 'module1',
        code: 'console.log("test1");',
      },
      {
        inputFile: 'test2.ts', // No conflict
        workspace: { targetDir: '/target' },
        infixPath: 'lib',
        outputModule: 'module2',
        code: 'console.log("test2");',
      },
    ];

    await batchWriteCode(writeRequests);

    // Should create directories
    expect(fs.mkdir).toHaveBeenCalledTimes(2);

    // Should write timestamped file for conflict and regular file for non-conflict// Check that both files were written without caring about order
    expect(writeFileMock).toHaveBeenCalledTimes(2);
    expect(writeFileMock.mock.calls).toEqual(
      expect.arrayContaining([
        [`/target/lib/module1/test1-${mockTimestamp}.ts`, 'console.log("test1");'],
        ['/target/lib/module2/test2.ts', 'console.log("test2");'],
      ]),
    );
    // expect(fs.writeFile).toHaveBeenCalledWith(`/target/lib/module1/test1-${mockTimestamp}.ts`, 'console.log("test1");');
    // expect(fs.writeFile).toHaveBeenCalledWith('/target/lib/module2/test2.ts', 'console.log("test2");');
  });
});

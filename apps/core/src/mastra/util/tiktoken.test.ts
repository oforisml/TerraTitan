import { expect, test, describe, beforeAll, afterAll } from 'vitest';
import { TokenCounter } from './tiktoken.js';

describe('calculateTokens', () => {
  let counter: TokenCounter;
  beforeAll(() => {
    counter = new TokenCounter('text-embedding-3-small');
  });
  afterAll(() => {
    counter.free();
  });
  test('should calculate tokens for a single string', () => {
    const input = 'Hello, world!';
    const expectedTokens = [4]; // Example expected token count
    const result = counter.count(input);
    expect(result).toEqual(expectedTokens);
  });

  test('should calculate tokens for multiple strings', () => {
    const inputs = ['Hello, world!', 'How are you?'];
    const expectedTokens = [4, 4]; // Example expected token counts
    const result = counter.count(...inputs);
    expect(result).toEqual(expectedTokens);
  });
});

/* eslint-env node, jest */
import { getUrl } from './index.js';

test('getUrl', () => {
  expect(getUrl('example.com')).toBe('example.com');
  expect(getUrl('example.com', { q: 'some thing', blah: 23 })).toBe('example.com?q=some%20thing&blah=23');
});

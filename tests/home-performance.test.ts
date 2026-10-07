import test from 'node:test';
import assert from 'node:assert/strict';
import {load} from 'cheerio';
import {deduplicateIcons} from '../src/lib/performance.ts';
import {acceptsGzip} from '../server/response.ts';

test('Repeated icons share geometry while preserving each accessible title',()=>{
  const path='<path d="M'+('1 2 '.repeat(60))+'Z"></path>';
  const source=`<svg viewBox="0 0 24 24"><title>First</title>${path}</svg><svg viewBox="0 0 24 24"><title>Second</title>${path}</svg>`;
  const $=load(deduplicateIcons(source,'fem-test'));
  assert.equal($('path').length,1);
  assert.equal($('use').length,2);
  assert.deepEqual($('title').map((_,e)=>$(e).text()).get(),['First','Second']);
  $('use').each((_,e)=>{assert.equal($($(e).attr('href')!).length,1);});
});

test('Compression respects an explicit gzip opt-out',()=>{
  assert.equal(acceptsGzip('gzip, deflate, br'),true);
  assert.equal(acceptsGzip('*;q=1,gzip;q=0'),false);
  assert.equal(acceptsGzip('br'),false);
  assert.equal(acceptsGzip('gzip;q=0.5'),true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mkdtemp,writeFile,unlink,rmdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {load} from 'cheerio';
import {deferComponentScripts,lazySectionImages} from '../src/lib/performance.ts';
import {transformStorefront} from '../server/transform.ts';
import {readAsset} from '../server/assets.ts';

test('Component delivery preserves critical globals and external app scripts',()=>{
  const source=`<link rel="modulepreload" href="{{ 'morph.js' | asset_url }}"><script src="{{ 'critical.js' | asset_url }}"></script><script src="{{ 'predictive-search.js' | asset_url }}" type="module"></script><script src="https://example.com/app.js" async></script>`;
  const result=deferComponentScripts(source);
  assert.match(result,/data-fem-module="predictive-search-component"/);
  assert.match(result,/<script src="\{\{ 'critical.js' \| asset_url \}\}"><\/script>/);
  assert.match(result,/<script src="https:\/\/example.com\/app.js" async><\/script>/);
  assert.doesNotMatch(result,/modulepreload/);
  assert.equal(deferComponentScripts(result),result);
});

test('Lazy images retain sources, responsive alternatives, dimensions and eager first images',()=>{
  const source=Array.from({length:7},(_,i)=>`<img src="${i}.webp" srcset="${i}@2x.webp 2x" width="600" height="800" loading="eager">`).join('');
  const $=load(lazySectionImages(source));
  assert.equal($('img[loading=eager]').length,4);
  assert.equal($('img[loading=lazy]').length,3);
  $('img').each((i,e)=>{
    assert.equal($(e).attr('src'),`${i}.webp`);
    assert.equal($(e).attr('srcset'),`${i}@2x.webp 2x`);
    assert.equal($(e).attr('width'),'600');assert.equal($(e).attr('height'),'800');
  });
});

test('All audited pages keep product text, form fields, media and icon geometry',()=>{
  const fixtures=JSON.parse(readFileSync('tests/fixtures/navigation.json','utf8')) as {html:string;url:string}[];
  const media=JSON.parse(readFileSync('server/media-manifest.json','utf8')) as Record<string,string>;
  const localMedia=(url:string)=>url.replace(/https:\/\/(?:cdn|assets)\.instant\.so\/[^\s"'<>)}|]+/g,url=>media[url]?'/__theme/'+media[url]:url);
  const signature=($:ReturnType<typeof load>)=>{
    const main=$('main');
    const content=main.clone();content.find('script,style,svg').remove();
    return {
      text:content.text().replace(/\s+/g,' ').trim(),
      inputs:main.find('input,select,textarea,button').map((_,e)=>[$(e).attr('name'),$(e).attr('type'),$(e).attr('value')].join('|')).get(),
      images:main.find('img').map((_,e)=>localMedia([$(e).attr('src'),$(e).attr('srcset'),$(e).attr('width'),$(e).attr('height')].join('|'))).get(),
      icons:main.find('svg').filter((_,e)=>!$(e).find('defs').length).map((_,e)=>{
        const icon=$(e).clone();
        icon.find('use').each((_,u)=>{const href=$(u).attr('href');if(href?.startsWith('#'))$(u).replaceWith($(href).html()??'');});
        return icon.find('path,circle,rect,line,polyline,polygon').map((_,p)=>JSON.stringify(p.attribs)).get().join('|');
      }).get()
    };
  };
  for(const fixture of fixtures){
    const original=load(fixture.html),result=load(transformStorefront(fixture.html));
    assert.deepEqual(signature(result),signature(original),fixture.url);
    result('use[href^="#fem-icon-"]').each((_,e)=>assert.equal(result(result(e).attr('href')!).length,1));
  }
});

test('Asset cache reuses bytes and invalidates immediately after a file changes',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'fem-asset-test-')),file=join(dir,'asset.css');
  try{
    await writeFile(file,'body{color:red}');
    const first=await readAsset(file,'v1');
    assert.equal(await readAsset(file,'v1'),first);
    await writeFile(file,'body{color:blue}');
    const [a,b]=await Promise.all([readAsset(file,'v2'),readAsset(file,'v2')]);
    assert.equal(a,b);assert.equal(a.toString(),'body{color:blue}');assert.notEqual(a,first);
  }finally{await unlink(file);await rmdir(dir);}
});

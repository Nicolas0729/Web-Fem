import {cp,readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {execFileSync} from 'node:child_process';
import {build,transform} from 'esbuild';
import {improveThemeMarkup} from '../src/lib/theme-quality.ts';
import {repairNavigation} from '../src/lib/navigation.ts';
export const componentSelectors: Record<string,string> = {
  'quick-add.js':'quick-add-component,quick-add-dialog',
  'variant-picker.js':'variant-picker','product-card.js':'product-card,swatches-variant-picker-component',
  'product-form.js':'product-form-component,add-to-cart-component','accordion-custom.js':'accordion-custom',
  'media.js':'deferred-media,product-model','product-price.js':'product-price',
  'product-title-truncation.js':'product-title','product-inventory.js':'product-inventory',
  'show-more.js':'show-more-component','slideshow.js':'slideshow-component',
  'floating-panel.js':'floating-panel-component','video-background.js':'video-background-component',
  'component-quantity-selector.js':'quantity-selector-component','media-gallery.js':'media-gallery',
  'rte-formatter.js':'rte-formatter','placeholder-image.js':'placeholder-image',
};
await mkdir('theme-dev',{recursive:true});
await cp('theme-source','theme-dev',{recursive:true});
const changed:string[]=[];
const staticImages=JSON.parse(await readFile('audit/image-dimensions.json','utf8'));
async function walk(directory:string):Promise<string[]> {
  const items=await readdir(directory,{withFileTypes:true});
  const paths=await Promise.all(items.map(d=>d.isDirectory()?walk(join(directory,d.name)):Promise.resolve([join(directory,d.name)])));
  return paths.flat();
}
for (const path of await walk('theme-dev')) {
  if (!path.endsWith('.liquid')) continue;
  const original=await readFile(path,'utf8');
  let next=improveThemeMarkup(repairNavigation(original,true).replaceAll('\u0000',''),staticImages); 
  if (next!==original) {await writeFile(path,next);changed.push(relative('theme-dev',path));}
}
const scriptPath='theme-dev/snippets/scripts.liquid';
let scripts=await readFile(scriptPath,'utf8');
for (const [name,selector] of Object.entries(componentSelectors)) {
  const escaped=name.replaceAll('.','\\.');
  scripts=scripts.replace(new RegExp(`<script[^>]*src="\\{\\{ '${escaped}' \\| asset_url \\}\\}"[^>]*><\\/script>`,'g'),`<script type="application/json" data-fem-module="${selector}" data-src="{{ '${name}' | asset_url }}"></script>`);
}
scripts+='\n<script type="module" src="{{ \'fem-runtime.js\' | asset_url }}"></script>\n';
await writeFile(scriptPath,scripts);changed.push('snippets/scripts.liquid');
const layoutPath='theme-dev/layout/theme.liquid';
let layout=await readFile(layoutPath,'utf8');
layout=layout.replace(/\s*<!-- Event snippet for Google Shopping App Purchase conversion page -->[\s\S]*?<\/script>/,'');
layout=layout.replace('<meta name="viewport" content="width=device-width, initial-scale=1">','');
layout=layout.replace("{%- render 'stylesheets' -%}","{%- render 'stylesheets' -%}\n    {{ 'fem-tokens.css' | asset_url | stylesheet_tag }}");
await writeFile(layoutPath,layout);changed.push('layout/theme.liquid');
await build({entryPoints:['src/components/runtime.ts'],outfile:'theme-dev/assets/fem-runtime.js',bundle:true,minify:true,format:'esm',target:'es2022'});
await cp('src/styles/tokens.css','theme-dev/assets/fem-tokens.css');
execFileSync('python3',['scripts/split-home.py'],{stdio:'inherit'});
execFileSync('python3',['scripts/extract-product-card.py'],{stdio:'inherit'});
changed.push('snippets/fem-product-card.liquid');
changed.push('sections/instant-QpL8HGFa3rotk5kl.liquid');
const home=JSON.parse(await readFile('audit/home-components.json','utf8')) as {component:string}[];
changed.push(...home.map(x=>`snippets/${x.component}.liquid`));
let saved=0;
for (const path of await walk('theme-dev/assets')) {
  if (!path.endsWith('.css')) continue;
  const original=await readFile(path,'utf8');
  try {const result=await transform(original,{loader:'css',minify:true,logLevel:'silent'});saved+=Buffer.byteLength(original)-Buffer.byteLength(result.code);await writeFile(path,result.code);} catch { /* Liquid CSS is kept verbatim. */ }
}
await writeFile('audit/build.json',JSON.stringify({builtAt:new Date().toISOString(),changed,cssBytesSaved:saved},null,2));
await writeFile('audit/component-selectors.json',JSON.stringify(componentSelectors,null,2));
console.log(`Tema compilado. ${changed.length} archivos Liquid modificados; ${saved} bytes de CSS reducidos.`);

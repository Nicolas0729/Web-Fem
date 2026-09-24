import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Liquid} from 'liquidjs';
import {load} from 'cheerio';
import {repairNavigation} from '../src/lib/navigation.ts';
import {improveThemeMarkup} from '../src/lib/theme-quality.ts';
interface Image {src:string;width:number;height:number;alt:string|null}
interface Variant {id:number;available:boolean;price:number;compare_at_price:number|null;featured_image?:Image|null}
interface StoreProduct {handle:string;title:string;id:number;variants:Variant[];media:{preview_image:Image}[];url:string}
function engine():Liquid {
 const liquid=new Liquid({root:resolve('theme-dev/snippets'),extname:'.liquid',strictFilters:true});
 for(const tag of ['doc','schema'])liquid.registerTag(tag,{parse(_token,tokens){this.liquid.parser.parseStream(tokens).on(`tag:end${tag}`,function(){this.stop();}).start();},render(){return '';}});
 liquid.registerFilter('asset_url',(value:string)=>`/__theme/${value}`);
 liquid.registerFilter('stylesheet_tag',(value:string)=>`<link rel="stylesheet" href="${value}">`);
 liquid.registerFilter('image_url',(value:Image|undefined,...args:unknown[])=>{
  if(!value?.src)return '';const width=(args.find(a=>Array.isArray(a)&&a[0]==='width') as [string,number]|undefined)?.[1];
  const url=new URL(value.src,'https://femprobiotics.co');if(width)url.searchParams.set('width',String(width));return url.href;
 });
 liquid.registerFilter('money',(cents:number)=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',minimumFractionDigits:2}).format(cents/100));
 return liquid;
}
function signature(html:string):unknown {
 const $=load(html);const root=$('[data-instant-type="root"]').first();
 return root.find('*').toArray().map(element=>{
  const attributes={...element.attribs};
  return {tag:element.tagName,attributes:Object.fromEntries(Object.entries(attributes).sort(([a],[b])=>a.localeCompare(b))),text:$(element).contents().filter((_,n)=>n.type==='text').text().replace(/\s+/g,' ').trim()};
 });
}
test('Refactored homepage renders the same DOM, text, prices and links as the source',async()=>{
 const products=JSON.parse(await readFile('audit/storefront-products.json','utf8')) as StoreProduct[];
 const allProducts=Object.fromEntries(products.map(p=>[p.handle,{...p,selected_or_first_available_variant:p.variants.find(v=>v.available)??p.variants[0],featured_image:p.media[0]?.preview_image}]));
 const context={section:{id:'test-home',location:'template',index:1,settings:{}},shop:{money_format:'${{amount}}'},all_products:allProducts,collections:{'todos-los-productos':{url:'/collections/todos-los-productos'}}};
 const original=improveThemeMarkup(repairNavigation(await readFile('theme-source/sections/instant-QpL8HGFa3rotk5kl.liquid','utf8'),true),JSON.parse(await readFile('audit/image-dimensions.json','utf8')));
 const updated=await readFile('theme-dev/sections/instant-QpL8HGFa3rotk5kl.liquid','utf8');
 const liquid=engine();
 const before=await liquid.parseAndRender(original,context,{globals:context}) as string;
 const after=await liquid.parseAndRender(updated,context,{globals:context}) as string;
 assert.deepEqual(signature(after),signature(before));
 const rendered=load(after);assert.equal(rendered('a[href="/products/duo-perfecto"]').length,2);
 assert.ok(rendered.text().includes('129.900'));
});

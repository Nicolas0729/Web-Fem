/** Adapter for HTML still published on Shopify. The shipped theme has no builder runtime.
 * Remove this adapter after publishing the native sections and retiring old template assignments.
 */
import {readFileSync} from 'node:fs';
export const sectionNames:Record<string,string>={
  '3OSDflDRH4rw2IGy':'fem-article-cuando-ovulos','51ICrVVH9j25O4RJ':'fem-product-gomitas',
  '5M861mKsQ7EVXmGJ':'fem-product-mom','6S6RIQqg4VQWqPig':'fem-blog',
  '9DiQk5qkf55XQZiz':'fem-contact','9DvYKHtHU4LVuyNi':'fem-footer',
  '9gdgtvDZWUL6N0KX':'fem-editorial-1','Au60canUCGIMViZY':'fem-product-ovulos',
  'bmPzy6K28rNrqB8Y':'fem-product-ecuador','Bxirwv0VtoLYoUeJ':'fem-article-usos-ovulos',
  'c3EqHm7hVL0jG1rC':'fem-product-amor','C4vjxcdrCgVz59cD':'fem-collection',
  'dfD8tRBaox1T0DnD':'fem-article-flora','FziHfOxyaRbyU98Z':'fem-product-probioticos',
  'GNXrJXnhK8A5RBT5':'fem-article-microbiota','I6WNGhZa0FLLm5XT':'fem-product-gomas-jabon',
  'iEhqD7KvvDZbMKkz':'fem-product-soda','jdP16YAeC3ZUSwdk':'fem-editorial-2',
  'jDWCbMIcVGcJwPSX':'fem-product-probiotico-ovulos','jk0iO6ALDrfmfm6c':'fem-collections',
  'Kikh7VzmQY85iams':'fem-header','LXYwbSAlRykfWhbn':'fem-editorial-3',
  'mnnei04QBCmysLAf':'fem-privacy','Nc9PggwhVQBdgu6q':'fem-product-combo-mama',
  'QNTWAEkArGNf5gXw':'fem-product-trio','QpL8HGFa3rotk5kl':'fem-home',
  'Rdgsyfq2bLxX865f':'fem-product-duo','TYDvqjsHHnAHijkZ':'fem-product-mom-doble',
  'uHBs4abgCJMwqIVy':'fem-product-gomas-probiotico','Wa2LQXfKdS1XVGsU':'fem-subscription-terms',
  'WujTYHJcwYlvVwBO':'fem-product-probiotico-doble','X7WaA0KXxZvOdac0':'fem-product-completo',
  'XMiGjEKoHnCBzujj':'fem-product-probiotico-soda','yKyQiloViRpl9a1J':'fem-product-ovulos-jabon',
  'yllIvKHIw2ISoa1k':'fem-product-jabon','zg3BdNZMjd83DdFH':'fem-product-probiotico-gomas',
  'zX2zkAycloBh8C5v':'fem-subscription-plans'
};
const media:Record<string,string>=JSON.parse(readFileSync(new URL('./media-manifest.json',import.meta.url),'utf8'));
export function nativeMarkup(source:string,mode:'preview'|'liquid'|'css'='preview'):string {
  const sectionIds:string[]=[];
  if(mode==='preview')source=source.replace(/data-section-id="([^"]*)"/g,(_,id)=>{sectionIds.push(id);return `data-section-id="__FEM_SECTION_${sectionIds.length-1}__"`;});
  let result=source.replace(/{% comment %}[\s\S]*?{% endcomment %}/g,comment=>/instant/i.test(comment)?'':comment)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,script=>/window\.Instant|client\.instant\.so|__instant_loading_core/.test(script)?'':script)
    .replace(/<!--[^]*?-->/g,comment=>/instant/i.test(comment)?'':comment);
  result=result.replace(/https:\/\/(?:cdn|assets)\.instant\.so\/[^\s"'<>)}]+/g,url=>{
    const filename=media[url.replaceAll('&amp;','&')];
    if(!filename)throw new Error('Missing locally stored media: '+url);
    return mode==='liquid'?`{{ '${filename}' | asset_url }}`:mode==='css'?'./'+filename:'/__theme/'+filename;
  });
  for(const[id,name]of Object.entries(sectionNames))result=result.replaceAll('instant-'+id,name);
  // Only the styling contracts are retained; none of the old executable runtime is bundled.
  result=result.replaceAll('data-instant-','data-fem-').replaceAll('__instant','fem-view')
    .replaceAll('--instant-','--fem-view-').replaceAll('instant_','fem_view_').replaceAll('instant-','fem-view-');
  result=result.replaceAll('add-to-fem-view-cart','add-to-cart').replaceAll('trigger-fem-view-cart','open-cart')
    .replaceAll('--fem-view-accordion-content-','--fem-accordion-content-');
  result=result.replace(/\sdata-fem-(?:version|published-at)="[^"]*"/g,'');
  // Keep only the layout/animation settings used by the native gallery. Discard Swiper internals.
  result=result.replace(/(<script\b[^>]*id="fem-view-slider-[^"]+-params"[^>]*>)([\s\S]*?)(<\/script>)/g,(_,start,json,end)=>{
    const config=JSON.parse(json);return start+JSON.stringify({breakpoints:config.breakpoints,loop:!!config.loop,autoplay:config.autoplay??false})+end;
  });
  return result.replace(/__FEM_SECTION_(\d+)__/g,(_,index)=>sectionIds[Number(index)]);
}

export const componentSelectors:Record<string,string> = {
  'quick-add.js':'quick-add-component,quick-add-dialog:has(dialog[open])',
  'variant-picker.js':'variant-picker',
  'product-card.js':'product-card,swatches-variant-picker-component',
  'product-form.js':'product-form-component,add-to-cart-component',
  'accordion-custom.js':'accordion-custom','media.js':'deferred-media,product-model',
  'product-price.js':'product-price','product-title-truncation.js':'product-title',
  'product-inventory.js':'product-inventory','show-more.js':'show-more-component',
  'slideshow.js':'slideshow-component','floating-panel.js':'floating-panel-component',
  'video-background.js':'video-background-component',
  'component-quantity-selector.js':'quantity-selector-component','media-gallery.js':'media-gallery',
  'rte-formatter.js':'rte-formatter','placeholder-image.js':'placeholder-image',
  'product-card-link.js':'product-card-link','predictive-search.js':'predictive-search-component',
  'localization.js':'localization-form-component,dropdown-localization-component,drawer-localization-component',
  'cart-discount.js':'cart-discount-component',
  'auto-close-details.js':'details[data-auto-close-details]',
};

export function deferComponentScripts(source:string):string {
  return source.replace(/<script\b([^>]*)>\s*<\/script>/g,(tag,attributes:string)=>{
    const name=attributes.match(/src="\{\{\s*'([^']+)'\s*\|\s*asset_url\s*\}\}"/)?.[1];
    const selector=name && componentSelectors[name];
    return selector?`<script type="application/json" data-fem-module="${selector}" data-src="{{ '${name}' | asset_url }}"></script>`:tag;
  }).replace(/<link\b(?=[^>]*\brel="modulepreload")[^>]*>\s*/g,'');
}

/** Keep the first visible media candidates eager; let the browser schedule the rest. */
export function lazySectionImages(source:string,eagerCount=4):string {
  let images=0;
  return source.replace(/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/g,tag=>{
    if(/fem-view-video__sizer|src="data:/.test(tag))return tag;
    if(++images<=eagerCount || /loading="lazy"/.test(tag))return tag;
    return tag.replace(/\s(?:loading|fetchpriority|decoding)="[^"]*"/g,'')
      .replace(/\s*\/?>$/,' loading="lazy" decoding="async" fetchpriority="auto">');
  });
}

export function deduplicateIcons(source:string,prefix:string):string {
  const pattern=/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g;
  const entries=new Map<string,{count:number;body:string;viewBox:string;id:string}>();
  const keyFor=(attributes:string,body:string):string|null=>{
    if(/<\/?(?:defs|use|script|style|symbol)\b|\bid\s*=|\{[{%]/i.test(body))return null;
    const viewBox=attributes.match(/viewBox="([^"]+)"/i)?.[1];
    return viewBox?`${viewBox}|${body.replace(/<title>[\s\S]*?<\/title>/g,'').trim()}`:null;
  };
  for(const match of source.matchAll(pattern)){
    const key=keyFor(match[1],match[2]);if(!key)continue;
    const existing=entries.get(key);
    if(existing)existing.count++;
    else entries.set(key,{count:1,body:match[2].replace(/<title>[\s\S]*?<\/title>/g,'').trim(),viewBox:match[1].match(/viewBox="([^"]+)"/i)![1],id:`${prefix}-${entries.size}`});
  }
  const reused=[...entries.values()].filter(entry=>entry.count>1&&entry.body.length>180);
  if(!reused.length)return source;
  const ids=new Set(reused.map(entry=>entry.id));
  const rewritten=source.replace(pattern,(svg,attributes:string,body:string)=>{
    const key=keyFor(attributes,body);const entry=key?entries.get(key):undefined;
    if(!entry||!ids.has(entry.id))return svg;
    const title=body.match(/<title>[\s\S]*?<\/title>/)?.[0]??'';
    return `<svg${attributes}>${title}<use href="#${entry.id}"></use></svg>`;
  });
  const defs=`<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute;overflow:hidden"><defs>${reused.map(entry=>`<symbol id="${entry.id}" viewBox="${entry.viewBox}">${entry.body}</symbol>`).join('')}</defs></svg>`;
  return defs+rewritten;
}

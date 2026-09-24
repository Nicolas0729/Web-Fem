import {load} from 'cheerio';
import {readFileSync} from 'node:fs';
import {repairNavigation,localHref,STORE_ORIGIN} from '../src/lib/navigation.ts';
const selectors = JSON.parse(readFileSync(new URL('../audit/component-selectors.json',import.meta.url),'utf8')) as Record<string,string>;
export function transformStorefront(html:string):string {
  const fullDocument=/<(?:!doctype|html)\b/i.test(html);
  const $=load(repairNavigation(html),{},fullDocument);
  $('script').each((_,element)=>{
    const script=$(element);const src=script.attr('src');
    if (src) {
      const url=new URL(src,STORE_ORIGIN); const name=url.pathname.split('/').pop() ?? '';
      if (url.pathname.includes('/cdn/shop/t/9/assets/') && selectors[name]) {
        script.attr('type','application/json').attr('data-fem-module',selectors[name]).attr('data-src',src).removeAttr('src').removeAttr('defer').removeAttr('fetchpriority');
      }
    } else if (script.text().includes("'send_to': 'AW-16944860206/PSfGCKORlbwaEK6Y-I8_'")) script.remove();
  });
  $('a[href]').each((_,element)=>{
    const link=$(element);const href=link.attr('href') ?? '';
    link.attr('href',localHref(href));
    if (/^\/(checkouts|customer_authentication|account|discount|apps|challenge)(\/|$)/.test(href)) link.attr('href',STORE_ORIGIN+href);
  });
  // Serve only theme code locally; Shopify and Instant still own their media/CDNs.
  $('[src],[href]').each((_,element)=>{
    const el=$(element);
    for (const attribute of ['src','href','data-src']) {
      const value=el.attr(attribute);if(!value)continue;
      try {
        const url=new URL(value,STORE_ORIGIN);
        if(url.hostname==='femprobiotics.co'&&url.pathname.startsWith('/cdn/shop/t/9/assets/')) el.attr(attribute,'/__theme/'+url.pathname.split('/').pop());
      } catch { /* Liquid-free malformed URL is reported by link audit. */ }
    }
  });
  $('script[data-src]').each((_,element)=>{
    const el=$(element);const value=el.attr('data-src')!;const url=new URL(value,STORE_ORIGIN);
    if(url.hostname==='femprobiotics.co'&&url.pathname.startsWith('/cdn/shop/t/9/assets/')) el.attr('data-src','/__theme/'+url.pathname.split('/').pop());
  });
  $('form[action]').each((_,element)=>{
    const form=$(element);const action=form.attr('action')!;
    if (/^\/?contact(?:$|[?#])/.test(action)) form.attr('action',new URL(action,STORE_ORIGIN).href);
  });
  $('meta[name="robots"]').remove();
  if(fullDocument)$('head').append('<meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/__theme/fem-tokens.css"><script type="module" src="/__theme/fem-runtime.js"></script>');
  return $.html().replace(/(?:https?:)?\/\/femprobiotics\.co\/cdn\/shop\/t\/9\/assets\/([a-zA-Z0-9_.-]+)(?:\?v=\d+)?/g, '/__theme/$1');
}

import {readFile,writeFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {transformStorefront} from '../server/transform.ts';
const inventory=JSON.parse(await readFile('audit/public-inventory.json','utf8')) as {url:string;file:string}[];
const routes=new Set<string>();
const bad:{page:string;href:string}[]=[];
for(const page of inventory){
 const $=load(transformStorefront(await readFile('audit/'+page.file,'utf8')));
 $('a[href]').each((_,el)=>{
  const href=$(el).attr('href')??'';
  if(['','null','undefined','#'].includes(href))bad.push({page:page.url,href});
  if(href.startsWith('/')&&!href.startsWith('//')&&!/^\/(checkout|customer_authentication|account|cart\/\d+)/.test(href))routes.add(href.split('#')[0]);
 });
 routes.add(new URL(page.url).pathname+new URL(page.url).search);
}
const results:{path:string;status:number;ok:boolean}[]=[];
const pending=[...routes];
async function worker(){while(pending.length){const path=pending.shift()!;try{const response=await fetch(`http://localhost:3000${path}`,{redirect:'manual',signal:AbortSignal.timeout(40000)});results.push({path,status:response.status,ok:response.status<400});await response.body?.cancel();}catch{results.push({path,status:0,ok:false});}}}
await Promise.all(Array.from({length:4},worker));
await writeFile('audit/link-check.json',JSON.stringify({checkedAt:new Date().toISOString(),invalidLinks:bad,routes:results.sort((a,b)=>a.path.localeCompare(b.path))},null,2));
console.log(JSON.stringify({routes:results.length,invalidLinks:bad.length,failures:results.filter(r=>!r.ok)},null,2));
if(bad.length||results.some(r=>!r.ok))process.exitCode=1;

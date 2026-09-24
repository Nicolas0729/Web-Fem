import {createServer,type IncomingMessage,type ServerResponse} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {join,basename} from 'node:path';
import {STORE_ORIGIN} from '../src/lib/navigation.ts';
import {checkoutPermalink,type CheckoutLine} from '../src/lib/checkout.ts';
import {transformStorefront} from './transform.ts';
const port=Number(process.env.PORT ?? 3000);
const redirectData=JSON.parse(await readFile('audit/redirects.json','utf8')) as {path:string;target:string}[];
const redirects=new Map(redirectData.map(row=>[row.path,row.target]));
const mime:Record<string,string>={css:'text/css',js:'text/javascript',svg:'image/svg+xml',json:'application/json',woff2:'font/woff2'};
const upstreamPaths=/^\/(?:$|products(?:\/|\.json)|collections(?:\/|$|\.json)|pages\/|blogs\/|policies\/|search(?:\/|$|\.json)|cart(?:\/|$|\.js)|cdn\/|recommendations\/|localization|robots\.txt|sitemap.*\.xml|favicon\.ico)/;
async function body(req:IncomingMessage):Promise<Buffer> {
  const chunks:Buffer[]=[];let length=0;
  for await(const chunk of req){length+=chunk.length;if(length>1024*1024)throw new Error('Request too large');chunks.push(Buffer.from(chunk));}
  return Buffer.concat(chunks);
}
async function serve(req:IncomingMessage,res:ServerResponse):Promise<void> {
  const url=new URL(req.url??'/',`http://127.0.0.1:${port}`);
  const redirect=redirects.get(url.pathname);
  if(redirect){res.writeHead(301,{Location:redirect}).end();return;}
  if(url.pathname==='/__health'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,mode:'shopify-connected-review',origin:STORE_ORIGIN}));return;}
  if(url.pathname.startsWith('/__theme/')){
    const name=decodeURIComponent(url.pathname.slice('/__theme/'.length));
    if(name!==basename(name)||name.includes('\0')){res.writeHead(400).end();return;}
    const file=join(process.cwd(),'theme-dev/assets',name);
    try{await stat(file);res.setHeader('Content-Type',mime[name.split('.').pop()!]??'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.end(await readFile(file));}catch{res.writeHead(404).end('Asset not found');}return;
  }
  if(url.pathname==='/__review'){
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile('docs/review.html','utf8'));return;
  }
  if(url.pathname==='/checkout'){
    const response=await fetch(STORE_ORIGIN+'/cart.js',{headers:{Cookie:req.headers.cookie??''},signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error('Shopify cart unavailable');
    const cart=await response.json() as {items:CheckoutLine[]};
    const target=checkoutPermalink(cart.items);
    if(target){res.writeHead(302,{Location:target}).end();return;}
    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.end('<h1>Continúa en la tienda oficial</h1><p>Los planes de suscripción y los atributos especiales se validan en Shopify. Esta vista local no puede transferirlos mediante un enlace de carrito.</p><a href="https://femprobiotics.co/cart">Abrir tienda oficial</a><br><a href="/cart">Volver al carrito local</a>');return;
  }
  if(/^\/(checkout|checkouts|account|customer_authentication|discount|apps|challenge)(\/|$)/.test(url.pathname)){
    res.writeHead(302,{Location:STORE_ORIGIN+url.pathname+url.search}).end();return;
  }
  if(!upstreamPaths.test(url.pathname)){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end('<h1>Página no encontrada</h1><a href="/">Volver a Fem</a>');return;}
  const method=req.method??'GET';
  if(!['GET','HEAD'].includes(method)&&!(method==='POST'&&/^\/cart(?:\/(add|change|update|clear)(\.js)?)?$/.test(url.pathname))){res.writeHead(405).end('Este formulario se completa en la tienda oficial.');return;}
  if(method==='POST') {
    const origin=req.headers.origin;
    if(origin&&![`http://localhost:${port}`,`http://127.0.0.1:${port}`].includes(origin)){res.writeHead(403).end();return;}
  }
  const headers:Record<string,string>={'User-Agent':req.headers['user-agent']??'Fem Local Review','Accept':req.headers.accept??'*/*','Accept-Language':req.headers['accept-language']??'es-CO,es;q=0.9'};
  if(req.headers.cookie)headers.Cookie=req.headers.cookie;
  if(req.headers['content-type'])headers['Content-Type']=req.headers['content-type'];
  const payload=method==='POST'?await body(req):undefined;
  const upstream=await fetch(STORE_ORIGIN+url.pathname+url.search,{method,headers,body:payload ? new Uint8Array(payload) : undefined,redirect:'manual',signal:AbortSignal.timeout(30000)});
  res.statusCode=upstream.status;
  res.setHeader('X-Robots-Tag','noindex, nofollow');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  const cookies=upstream.headers.getSetCookie().map(c=>c.replace(/;\s*domain=[^;]+/ig,'').replace(/;\s*secure\b/ig,'').replace(/SameSite=None/ig,'SameSite=Lax'));
  if(cookies.length)res.setHeader('Set-Cookie',cookies);
  const location=upstream.headers.get('location');
  if(location){const target=new URL(location,STORE_ORIGIN);res.setHeader('Location',target.origin===STORE_ORIGIN&&!/^\/(checkouts|account|customer_authentication|discount|apps|challenge)(\/|$)/.test(target.pathname)?target.pathname+target.search+target.hash:target.href);res.end();return;}
  const type=upstream.headers.get('content-type')??'application/octet-stream';res.setHeader('Content-Type',type);
  if(method==='HEAD'){res.end();return;}
  if(type.includes('text/html'))res.end(transformStorefront(await upstream.text()));
  else if(type.includes('application/json')) {
    const data:unknown=await upstream.json();
    const transformSections=(value:unknown):unknown=>{
      if(typeof value==='string'&&/^\s*</.test(value))return transformStorefront(value);
      if(Array.isArray(value))return value.map(transformSections);
      if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,transformSections(item)]));
      return value;
    };
    res.end(JSON.stringify(transformSections(data)));
  }
  else res.end(Buffer.from(await upstream.arrayBuffer()));
}
createServer((req,res)=>{void serve(req,res).catch(error=>{console.error(error instanceof Error?error.message:error);if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/html; charset=utf-8'});res.end('<h1>No pudimos consultar Shopify</h1><p>Revisa tu conexión e inténtalo nuevamente.</p><a href="/">Volver a intentar</a>');});}).listen(port,'127.0.0.1',()=>console.log(`FEM local: http://localhost:${port}\nRevisión técnica: http://localhost:${port}/__review`));

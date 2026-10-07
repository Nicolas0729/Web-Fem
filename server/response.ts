import {gzip as compress} from 'node:zlib';
import {promisify} from 'node:util';
import type {IncomingMessage,ServerResponse} from 'node:http';

const gzip=promisify(compress);
const compressedAssets=new WeakMap<Buffer,Promise<Buffer>>();
export function acceptsGzip(header:string):boolean {
  const accepted=new Map(header.toLowerCase().split(',').map(value=>{
    const [name,...parameters]=value.trim().split(';');
    const quality=parameters.find(p=>p.trim().startsWith('q='));
    return [name,quality?Number(quality.trim().slice(2)):1] as const;
  }));
  return (accepted.get('gzip')??accepted.get('*')??0)>0;
}

export async function sendBody(req:IncomingMessage,res:ServerResponse,value:string|Buffer):Promise<void> {
  const data=typeof value==='string'?Buffer.from(value):value;
  const contentType=String(res.getHeader('Content-Type')??'');
  const compressible=/^(text\/|application\/(?:json|javascript)|image\/svg\+xml)/.test(contentType);
  if(compressible)res.setHeader('Vary','Accept-Encoding');
  const compressed=compressible && data.length>=1024 && acceptsGzip(req.headers['accept-encoding']??'');
  let payload=data;
  if(compressed){
    let pending=compressedAssets.get(data);
    if(!pending){
      pending=gzip(data).catch(error=>{compressedAssets.delete(data);throw error;});
      if(Buffer.isBuffer(value))compressedAssets.set(data,pending);
    }
    payload=await pending;
  }
  if(compressed)res.setHeader('Content-Encoding','gzip');
  res.setHeader('Content-Length',payload.length);
  res.end(req.method==='HEAD'?undefined:payload);
}

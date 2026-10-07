import {readFile} from 'node:fs/promises';

type Entry={version:string;data:Buffer};
const cache=new Map<string,Entry>();
const pending=new Map<string,Promise<Buffer>>();
const limit=32*1024*1024;
let bytes=0;

export async function readAsset(path:string,version:string):Promise<Buffer> {
  const cached=cache.get(path);
  if(cached?.version===version){
    cache.delete(path);cache.set(path,cached);
    return cached.data;
  }
  const key=path+'\0'+version;
  const existing=pending.get(key);if(existing)return existing;
  const request=readFile(path).then(data=>{
    const old=cache.get(path);if(old){bytes-=old.data.length;cache.delete(path);}
    if(data.length<=limit){
      while(bytes+data.length>limit){
        const oldest=cache.keys().next().value!;
        bytes-=cache.get(oldest)!.data.length;cache.delete(oldest);
      }
      cache.set(path,{version,data});bytes+=data.length;
    }
    return data;
  }).finally(()=>pending.delete(key));
  pending.set(key,request);return request;
}

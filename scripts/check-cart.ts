import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import type {Cart} from '../src/types/shopify.ts';
const jar=new Map<string,string>();
const steps:string[]=[];
async function request(path:string,body?:object):Promise<unknown>{
 const response=await fetch('http://localhost:3000'+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Cookie:[...jar].map(([k,v])=>`${k}=${v}`).join('; ')},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(25000)});
 for(const raw of response.headers.getSetCookie()){const pair=raw.split(';')[0];const index=pair.indexOf('=');jar.set(pair.slice(0,index),pair.slice(index+1));}
 assert.equal(response.status,200,`${path}: HTTP ${response.status}`);return response.json();
}
const variant=43661845299288;
try{
 const initial=await request('/cart.js') as Cart;assert.equal(initial.item_count,0,'Test must start with an isolated empty cart');steps.push('Carrito nuevo vacío');
 await request('/cart/add.js',{items:[{id:variant,quantity:1}]});
 const added=await request('/cart.js') as Cart;assert.equal(added.item_count,1);assert.equal(added.items[0].variant_id,variant);steps.push('Añadir variante real');
 const changed=await request('/cart/change.js',{id:added.items[0].key,quantity:2}) as Cart;assert.equal(changed.item_count,2);assert.equal(changed.items[0].quantity,2);steps.push('Actualizar cantidad');
 const removed=await request('/cart/change.js',{id:changed.items[0].key,quantity:0}) as Cart;assert.equal(removed.item_count,0);steps.push('Eliminar producto');
 await writeFile('audit/cart-check.json',JSON.stringify({checkedAt:new Date().toISOString(),passed:true,steps,purchaseSubmitted:false},null,2));
 console.log('Carrito: '+steps.join(' → ')+'. Sin pedido ni pago.');
}catch(error){
 await writeFile('audit/cart-check.json',JSON.stringify({checkedAt:new Date().toISOString(),passed:false,steps,error:error instanceof Error?error.message:String(error)},null,2));throw error;
}finally{
 // Only this newly-created test cart is cleared; no customer session is touched.
 if(jar.size)await request('/cart/clear.js',{}).catch(()=>undefined);
}

import test from 'node:test';
import assert from 'node:assert/strict';
import {Window} from 'happy-dom';
import {ScratchCoverage} from '../src/lib/scratch-coverage.ts';
import {renderScratchCard} from '../server/native-home.ts';
import {transformStorefront} from '../server/transform.ts';

const photo='https://d3k81ch9hvuctc.cloudfront.net/company/TDVtU4/images/7ccc4632-e3f5-4449-a58e-2025e6346375.jpeg';
const markup=(id='QX2wGL',image=true)=>`<form data-testid="klaviyo-form-${id}">${image?`<div class="photo"><div><img src="${photo}" alt="Bienvenida a FEM"></div></div>`:''}<div class="details"><div data-testid="form-row"><div data-testid="form-component"><h1>10% de DESCUENTO</h1></div></div><div data-testid="form-row"><div data-testid="form-component">EN TU PRIMERA COMPRA</div></div><div data-testid="form-row"><div data-testid="form-component"><input type="email" name="email"></div></div><div data-testid="form-row"><div data-testid="form-component"><button type="button" data-action-id="existing-submit">LO QUIERO</button></div></div><div data-testid="form-row"><div data-testid="form-component"><button type="button" data-action-id="existing-close">No quiero ahorrar</button></div></div><div data-testid="form-row"><div data-testid="form-component">Al completar este formulario aceptas recibir nuestros emails y nuestra política de privacidad.</div></div></div><input type="submit" style="display:none"></form>`;

function environment(html:string){
  const window=new Window({url:'http://localhost:3000/',settings:{enableJavaScriptEvaluation:false,disableJavaScriptFileLoading:true,disableCSSFileLoading:true,enableImageFileLoading:false,disableIframePageLoading:true}});
  for(const key of ['document','location','HTMLElement','Element'])Object.defineProperty(globalThis,key,{value:(window as any)[key],configurable:true,writable:true});
  Object.assign(globalThis,{window});window.document.body.innerHTML=renderScratchCard()+html;
  return window;
}

test('Scratch coverage counts cleared area once, ignores off-card marks and requires real coverage',()=>{
  const coverage=new ScratchCoverage();
  assert.equal(coverage.erase({x:-100,y:-100},{x:-80,y:-80}),0);
  const once=coverage.erase({x:100,y:100},{x:100,y:100});
  for(let i=0;i<100;i++)assert.equal(coverage.erase({x:100,y:100},{x:100,y:100}),once);
  assert.ok(once<.05);
  let progress=0;for(let y=0;y<=420;y+=40)progress=coverage.erase({x:0,y},{x:720,y});
  assert.equal(progress,1);
});

test('Mouse/touch reveal works without a button and preserves the email form',async t=>{
  const window=environment(`<div style="transform:scale(.39)"><div data-testid="POPUP"><div data-testid="modal-form-container">${markup()}</div></div></div>`+markup('another-form')),doc=window.document;
  t.after(()=>window.happyDOM.close());
  let strokes=0;
  const context={fillStyle:'',strokeStyle:'',createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},stroke(){strokes++;}};
  window.HTMLCanvasElement.prototype.getContext=(()=>context) as any;
  const {enhanceScratchPromotion}=await import('../src/components/scratch-promotion.ts');
  const form=doc.querySelector('form')!,details=form.querySelector('.details')!,email=form.querySelector('input')!;
  const originalEmail=email.outerHTML,submit=form.querySelector('button')!;let submitted=0;submit.addEventListener('click',()=>submitted++);
  enhanceScratchPromotion(doc as unknown as Document);
  assert.equal(doc.querySelectorAll('.fem-scratch').length,1);
  assert.ok(form.closest('[data-fem-scratch-frame]'));
  assert.equal(form.querySelector('[data-fem-scratch-photo]'),form.querySelector('.photo'));
  const card=form.querySelector('.fem-scratch')!,canvas=card.querySelector('canvas')!;
  assert.equal(card.querySelector('button'),null);
  assert.equal(card.querySelector('[role="status"]')!.textContent,'');
  Object.defineProperty(canvas,'getBoundingClientRect',{value:()=>({left:0,top:0,width:720,height:420})});
  const pointer=(type:string,x:number,y:number,pointerType='mouse',buttons=type==='pointerdown'||type==='pointermove'?1:0)=>canvas.dispatchEvent(new window.PointerEvent(type,{pointerId:1,button:0,buttons,isPrimary:true,pointerType,clientX:x,clientY:y}));
  assert.equal(context.fillStyle,'#000');assert.equal(context.strokeStyle,'#000');
  pointer('pointermove',100,40,'mouse',0);assert.equal(strokes,0);
  pointer('pointerdown',40,40);pointer('pointermove',300,40);assert.equal(strokes,2);
  pointer('pointermove',400,40,'mouse',0);pointer('pointermove',500,40);assert.equal(strokes,2);
  pointer('pointerdown',40,40);window.dispatchEvent(new window.PointerEvent('pointerup',{pointerId:1}));pointer('pointermove',600,40);assert.equal(strokes,3);
  pointer('pointerdown',40,40);window.dispatchEvent(new window.Event('blur'));pointer('pointermove',600,40);assert.equal(strokes,4);
  pointer('pointerdown',40,40);pointer('pointercancel',40,40);const previous=strokes;pointer('pointermove',700,400);assert.equal(strokes,previous);
  for(let y=30;y<330&&!card.classList.contains('fem-scratch--revealed');y+=50){pointer('pointerdown',0,y,'touch');pointer('pointermove',720,y,'touch');pointer('pointerup',720,y,'touch');}
  assert.ok(card.classList.contains('fem-scratch--revealed'));
  assert.match(card.querySelector('[role="status"]')!.textContent,/10%/);
  assert.equal(card.querySelector('button'),null);assert.equal(submitted,0);
  assert.equal(email.outerHTML,originalEmail);
  assert.equal(form.querySelector('[data-fem-scratch-submit]'),submit);
  assert.equal(form.querySelector('[data-fem-scratch-layout]'),null);
  assert.equal(form.hasAttribute('data-fem-scratch-layout'),true);
  assert.equal(form.querySelector('.fem-scratch')!.nextElementSibling,form.querySelector('.photo'));
  assert.equal(details.querySelector('h2')!.textContent,'Ingresa tu correo para redimir tu descuento');
  assert.equal(details.querySelectorAll('[data-fem-scratch-old-heading]').length,2);
  assert.ok(details.querySelector('[data-fem-scratch-consent]'));
  enhanceScratchPromotion(canvas as unknown as Element);assert.equal(doc.querySelectorAll('.fem-scratch').length,1);
  assert.equal(details.querySelectorAll('.fem-scratch-redemption').length,1);
  (submit as any).click();assert.equal(submitted,1);
  form.remove();doc.body.insertAdjacentHTML('beforeend',markup('QX2wGL',false));enhanceScratchPromotion(doc as unknown as Document);
  assert.ok(doc.querySelector('.fem-scratch--revealed'));
  assert.equal(doc.querySelectorAll('.fem-scratch').length,1);
  assert.equal(doc.querySelector('[data-testid="klaviyo-form-another-form"]')!.querySelector('.fem-scratch'),null);
});

test('Local scratch preview starts covered even with a previously revealed discount',async t=>{
  const window=environment(markup('QX2wGL',false)),doc=window.document;
  t.after(()=>window.happyDOM.close());
  window.location.href='http://localhost:3000/?fem-scratch=1';
  window.sessionStorage.setItem('fem:welcome-10:revealed','1');
  window.HTMLCanvasElement.prototype.getContext=(()=>({createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},arc(){},fill(){},moveTo(){},lineTo(){},stroke(){}})) as any;
  const {enhanceScratchPromotion}=await import('../src/components/scratch-promotion.ts');
  enhanceScratchPromotion(doc as unknown as Document);
  assert.equal(doc.querySelector('.fem-scratch--revealed'),null);
  const canvas=doc.querySelector('canvas')!;
  Object.defineProperty(canvas,'getBoundingClientRect',{value:()=>({left:0,top:0,width:720,height:420})});
  for(let y=30;y<330;y+=50){
    canvas.dispatchEvent(new window.PointerEvent('pointerdown',{pointerId:1,button:0,buttons:1,isPrimary:true,pointerType:'mouse',clientX:0,clientY:y}));
    canvas.dispatchEvent(new window.PointerEvent('pointermove',{pointerId:1,buttons:1,pointerType:'mouse',clientX:720,clientY:y}));
    canvas.dispatchEvent(new window.PointerEvent('pointerup',{pointerId:1}));
  }
  assert.ok(doc.querySelector('.fem-scratch--revealed'));
  doc.querySelector('form')!.remove();doc.body.insertAdjacentHTML('beforeend',markup('QX2wGL',false));
  enhanceScratchPromotion(doc as unknown as Document);
  assert.equal(doc.querySelector('.fem-scratch--revealed'),null);
  assert.equal(window.sessionStorage.getItem('fem:welcome-10:revealed'),'1');
});

test('Without canvas or storage, the discount remains available without a reveal button',async t=>{
  const window=environment(markup('QX2wGL',false)),doc=window.document;
  t.after(()=>window.happyDOM.close());
  window.HTMLCanvasElement.prototype.getContext=(()=>null) as any;
  Object.defineProperty(window,'sessionStorage',{get(){throw new Error('Storage disabled');}});
  const moduleURL=new URL('../src/components/scratch-promotion.ts',import.meta.url);moduleURL.search='fallback';
  const {enhanceScratchPromotion}=await import(moduleURL.href);
  enhanceScratchPromotion(doc);
  assert.ok(doc.querySelector('.fem-scratch--revealed'));
  assert.equal(doc.querySelector('.fem-scratch button'),null);
  assert.match(doc.querySelector('.fem-scratch__status')!.textContent,/10%/);
});

test('Preview and theme share a single translated template without injecting extra forms',()=>{
  const html=transformStorefront('<!doctype html><html><head></head><body></body></html>','/');
  assert.match(html,/id="fem-scratch-template"/);assert.match(html,/Raspa y gana/);
  assert.doesNotMatch(html,/fem_scratch\./);
  assert.equal((transformStorefront(html,'/').match(/id="fem-scratch-template"/g)||[]).length,1);
});

test('Home opens the welcome popup once, and dismissal is remembered across page loads',async t=>{
  const window=environment('<main class="fem-home"></main><div style="display:none">'+markup()+'</div>');
  t.after(()=>window.happyDOM.close());
  const callbacks:(()=>void)[]=[];
  window.setTimeout=((callback:()=>void,delay:number)=>{assert.equal(delay,2500);callbacks.push(callback);return callbacks.length;}) as any;
  const moduleURL=new URL('../src/components/scratch-promotion.ts',import.meta.url);moduleURL.search='auto-open';
  const {initializeScratchPromotion}=await import(moduleURL.href);
  initializeScratchPromotion();initializeScratchPromotion();
  assert.equal(callbacks.length,1);
  assert.equal((window as any)._klOnsite,undefined);
  callbacks[0]();
  assert.deepEqual((window as any)._klOnsite,[['openForm','QX2wGL']]);
  window.dispatchEvent(new window.CustomEvent('klaviyoForms',{detail:{formId:'QX2wGL',type:'close'}}));
  assert.equal(window.sessionStorage.getItem('fem:welcome-10:shown'),'1');
  moduleURL.search='auto-open-next-page';
  (await import(moduleURL.href)).initializeScratchPromotion();
  assert.equal(callbacks.length,1);
  assert.equal((window as any)._klOnsite.length,1);
});

test('Automatic popup respects a native Klaviyo opening and does not force it on product pages',async t=>{
  const window=environment('<main class="fem-home"></main>');
  t.after(()=>window.happyDOM.close());
  let callback:(()=>void)|undefined,cleared=false;
  window.setTimeout=((fn:()=>void)=>{callback=fn;return 1;}) as any;
  window.clearTimeout=(()=>{cleared=true;}) as any;
  const moduleURL=new URL('../src/components/scratch-promotion.ts',import.meta.url);moduleURL.search='native-open';
  (await import(moduleURL.href)).initializeScratchPromotion();
  window.dispatchEvent(new window.CustomEvent('klaviyoForms',{detail:{formId:'another-form',type:'open'}}));
  assert.equal(cleared,false);
  window.dispatchEvent(new window.CustomEvent('klaviyoForms',{detail:{formId:'QX2wGL',type:'open'}}));
  assert.equal(cleared,true);
  callback!();
  assert.equal((window as any)._klOnsite,undefined);
  window.document.querySelector('main')!.className='product';
  window.sessionStorage.clear();callback=undefined;
  moduleURL.search='product-page';
  (await import(moduleURL.href)).initializeScratchPromotion();
  assert.equal(callback,undefined);
  assert.equal((window as any)._klOnsite,undefined);
});

test('Local preview can still open after dismissal, without waiting or duplicate requests',async t=>{
  const window=environment('');
  t.after(()=>window.happyDOM.close());
  window.location.href='http://localhost:3000/?fem-scratch=1';
  window.sessionStorage.setItem('fem:welcome-10:shown','1');
  const moduleURL=new URL('../src/components/scratch-promotion.ts',import.meta.url);moduleURL.search='preview-open';
  const {initializeScratchPromotion}=await import(moduleURL.href);
  initializeScratchPromotion();initializeScratchPromotion();
  assert.deepEqual((window as any)._klOnsite,[['openForm','QX2wGL']]);
});

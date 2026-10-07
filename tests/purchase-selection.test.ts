import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolvePurchaseSelection,type PurchaseOption,type PurchaseVariant} from '../src/lib/purchase-selection.ts';
import {addItemFromFields} from '../src/lib/cart.ts';

const {options,variants}=JSON.parse(readFileSync('tests/fixtures/purchase-options.json','utf8')) as {options:PurchaseOption[];variants:(PurchaseVariant&{price:number;available:boolean})[]};
const subscriptionProducts=JSON.parse(readFileSync('tests/fixtures/subscription-products.json','utf8')) as {handle:string;options:PurchaseOption[];variants:(PurchaseVariant&{price:number;available:boolean})[]}[];

test('Quantity changes preserve one-time purchase in both directions and send the matching pack to the cart',()=>{
  const two=resolvePurchaseSelection(variants,options,['Compra Única 1','2 unidades'])!;
  assert.equal(two.purchase,'Compra Única 2');
  assert.equal(two.variant.id,44093805690968);
  assert.equal(variants.find(variant=>variant.id===two.variant.id)?.price,16990000);
  assert.deepEqual(addItemFromFields(two.variant.id,1,[]),{id:44093805690968,quantity:1});
  const one=resolvePurchaseSelection(variants,options,[two.purchase,'1 unidad'])!;
  assert.equal(one.purchase,'Compra Única 1');
  assert.equal(one.variant.id,43659069325400);
});

test('Subscription remains selected through repeated pack changes and retains its own prices',()=>{
  let purchase='Suscripción 1';
  for(const quantity of ['2 unidades','1 unidad','2 unidades','1 unidad']){
    const next=resolvePurchaseSelection(variants,options,[purchase,quantity])!;
    const two=quantity==='2 unidades';
    assert.equal(next.purchase,two?'Suscripción 2':'Suscripción 1');
    assert.equal(next.variant.id,two?43659069489240:43659069390936);
    assert.equal(variants.find(variant=>variant.id===next.variant.id)?.price,two?14990000:8990000);
    purchase=next.purchase;
  }
});

test('Every legacy variant deep link resolves to a visible card without changing the purchase type or price',()=>{
  for(const variant of variants){
    const next=resolvePurchaseSelection(variants,options,variant.options)!;
    assert.equal(next.purchase.replace(/ \d+$/,''),variant.options[0].replace(/ \d+$/,''));
    assert.equal(variants.find(item=>item.id===next.variant.id)?.price,variant.price);
    assert.equal(next.variant.options[1],variant.options[1]);
    assert.ok(next.purchase.endsWith(` ${next.quantity}`));
  }
});

test('Missing or sold-out combinations do not silently switch the purchase type',()=>{
  const withoutSubscription=variants.filter(variant=>variant.id!==43659069489240);
  assert.equal(resolvePurchaseSelection(withoutSubscription,options,['Suscripción 1','2 unidades']),undefined);
  const soldOut=variants.map(variant=>({...variant,available:false}));
  assert.equal(resolvePurchaseSelection(soldOut,options,['Suscripción 1','2 unidades'])?.variant.id,43659069489240);
  assert.equal(resolvePurchaseSelection(variants,options,['Compra Única 1','3 unidades']),undefined);
  assert.equal(resolvePurchaseSelection(variants,[{name:'Talla',position:1,values:['S','M']}],['S']),undefined);
});

test('Other variant options are preserved even when purchase and quantity positions change',()=>{
  const reorderedOptions=[{...options[1],position:1},{name:'Sabor',position:2,values:['Fresa','Natural']},{...options[0],position:3}];
  const reorderedVariants=[{id:1,options:['2 unidades','Fresa','Suscripción 2']},{id:2,options:['2 unidades','Natural','Suscripción 2']}];
  assert.equal(resolvePurchaseSelection(reorderedVariants,reorderedOptions,['2 unidades','Natural','Suscripción 1'])?.variant.id,2);
});

for(const product of subscriptionProducts){
  test(`${product.handle}: every purchase type survives changes between all pack sizes`,()=>{
    const purchaseOption=product.options.find(option=>option.name==='Tipo de compra')!;
    const quantityOption=product.options.find(option=>option.name==='Cantidad')!;
    for(const initial of product.variants){
      let selected=[...initial.options];
      const purchaseType=selected[purchaseOption.position-1].replace(/ \d+$/,'').toLocaleLowerCase('es');
      for(const quantity of [...quantityOption.values,...[...quantityOption.values].reverse()]){
        selected[quantityOption.position-1]=quantity;
        const next=resolvePurchaseSelection(product.variants,product.options,selected);
        assert.ok(next,`${initial.id}: ${selected.join(' / ')}`);
        assert.equal(next.purchase.replace(/ \d+$/,'').toLocaleLowerCase('es'),purchaseType);
        assert.ok(purchaseOption.values.includes(next.purchase),'Use the exact Shopify option value');
        assert.equal(next.variant.options[quantityOption.position-1],quantity);
        assert.equal(next.quantity,quantity.split(' ')[0]);
        const actual=product.variants.find(variant=>variant.id===next.variant.id)!;
        assert.ok(Number.isFinite(actual.price));
        assert.equal(addItemFromFields(next.variant.id,1,[]).id,actual.id);
        selected=[...next.variant.options];
      }
    }
  });
}

test('Dúo Perfecto matches differently capitalized labels without changing the stored Shopify spelling',()=>{
  const product=subscriptionProducts.find(product=>product.handle==='duo-perfecto')!;
  const two=resolvePurchaseSelection(product.variants,product.options,['Compra Única 1','2 Unidades'])!;
  assert.equal(two?.purchase,'Compra única 2');
  assert.equal(two.variant.id,44093818601560);
  const one=resolvePurchaseSelection(product.variants,product.options,[two.purchase,'1 Unidad'])!;
  assert.equal(one.purchase,'Compra Única 1');
  assert.equal(one.variant.id,43656647606360);
});


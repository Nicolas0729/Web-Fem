export interface PurchaseOption {name:string;position:number;values:string[]}
export interface PurchaseVariant {id:number;options:string[]}

/** The legacy picker has a separate purchase option for each pack size. */
export function resolvePurchaseSelection(variants:PurchaseVariant[],options:PurchaseOption[],selected:string[]):{variant:PurchaseVariant;purchase:string;quantity:string}|undefined {
  const purchaseOption=options.find(option=>option.name==='Tipo de compra');
  const quantityOption=options.find(option=>option.name==='Cantidad');
  if(!purchaseOption || !quantityOption)return;
  const purchaseIndex=purchaseOption.position-1,quantityIndex=quantityOption.position-1;
  const purchase=selected[purchaseIndex]?.match(/^(.+?)\s+\d+$/u);
  const quantity=selected[quantityIndex]?.match(/^(\d+)\s+unidad(?:es)?$/iu);
  if(!purchase || !quantity)return;
  const desiredPurchase=`${purchase[1]} ${quantity[1]}`.normalize('NFC').toLocaleLowerCase('es');
  // Labels vary between products ("Compra Única" / "Compra única"). Keep
  // Shopify's original spelling when selecting the equivalent pack option.
  const value=purchaseOption.values.find(option=>option.normalize('NFC').toLocaleLowerCase('es')===desiredPurchase);
  if(!value)return;
  const desired=selected.map((option,index)=>index===purchaseIndex?value:option);
  const variant=variants.find(item=>item.options.length===desired.length && item.options.every((option,index)=>option===desired[index]));
  if(variant)return {variant,purchase:value,quantity:quantity[1]};
}

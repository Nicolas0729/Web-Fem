import {STORE_ORIGIN} from './navigation.ts';
export interface CheckoutLine {variant_id:number;quantity:number;selling_plan_allocation?:unknown;properties?:Record<string,unknown>}
/** Permalinks are Shopify's official transfer mechanism for simple one-time carts. */
export function checkoutPermalink(lines:CheckoutLine[]):string|null {
  if(!lines.length)return null;
  if(lines.some(line=>line.selling_plan_allocation||Object.keys(line.properties??{}).some(key=>!key.startsWith('_'))))return null;
  if(lines.some(line=>!Number.isSafeInteger(line.variant_id)||line.variant_id<=0||!Number.isInteger(line.quantity)||line.quantity<=0))throw new Error('Invalid cart line');
  return `${STORE_ORIGIN}/cart/${lines.map(line=>`${line.variant_id}:${line.quantity}`).join(',')}`;
}

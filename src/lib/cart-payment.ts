import type {CartState} from './cart.ts';
export type PaymentPreference='cod'|'prepaid';
export const paymentPreference=(cart:CartState):PaymentPreference=>cart.attributes?.fem_payment_preference==='prepaid'?'prepaid':'cod';
export const paymentAttributes=(choice:PaymentPreference):Record<string,string>=>({
  fem_payment_preference:choice,
  fem_satin_reward:choice==='prepaid'?'pending_payment_confirmation':''
});
export const satinRewardUnlocked=(cart:CartState)=>cart.item_count>0&&paymentPreference(cart)==='prepaid';

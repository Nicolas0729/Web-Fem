export interface Money { amount: string; currencyCode: string }
export interface ShopifyImage { url: string; altText: string | null; width: number; height: number }
export interface Metafield { namespace: string; key: string; type: string; value: string }
export interface Metaobject { id: string; type: string; handle: string; fields: Metafield[] }
export interface Variant { id: number; title: string; available: boolean; price: number; compare_at_price: number | null; options: string[]; selling_plan_allocations: SellingPlanAllocation[] }
export interface SellingPlanAllocation { selling_plan_id: number; price: number; compare_at_price: number }
export interface Product { id: number; handle: string; title: string; description: string; available: boolean; variants: Variant[]; images: string[]; url: string; price: number; compare_at_price: number | null }
export interface Collection { id: string; handle: string; title: string; products: Product[] }
export interface CartLine { key: string; variant_id: number; quantity: number; title: string; price: number; final_line_price: number; url: string }
export interface Cart { token: string; items: CartLine[]; item_count: number; total_price: number; currency: string }
export interface Article { handle: string; title: string; body: string; publishedAt: string; templateSuffix: string | null }
export interface Blog { handle: string; title: string; articles: Article[] }
export interface Menu { handle: string; title: string; items: MenuItem[] }
export interface MenuItem { title: string; url: string; items: MenuItem[] }

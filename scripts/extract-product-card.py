"""Unify eight structurally identical cards, keeping each audited style hook."""
import pathlib,re,json
root=pathlib.Path(__file__).resolve().parents[1];path=root/'theme-dev/snippets/fem-home-bestsellers.liquid';source=path.read_text()
pattern=r'<form\b[\s\S]*?</form\s*>'
forms=re.findall(pattern,source);assert len(forms)==8
classes=lambda s:list(dict.fromkeys(re.findall(r'\bi[A-Za-z0-9]{16}\b',s)))
base=forms[0];baseClasses=classes(base)
assert all(len(classes(f))==len(baseClasses) for f in forms)
base=re.sub(r'product_[A-Za-z0-9]+_variant','card_variant',base)
base=re.sub(r'product_[A-Za-z0-9]+_image','card_image',base)
base=re.sub(r'product_[A-Za-z0-9]+','card_product',base)
for i,c in enumerate(baseClasses):base=base.replace(c,'{{ style_hooks['+str(i)+'] }}')
base=base.replace('<p>ver producto</p>','<p>{{ cta_text | escape }}</p>')
header='''{% doc %}
Audited product card. Prices, availability and images are Shopify-owned.
@param {product} card_product - Product selected by the parent section
@param {variant} card_variant - Selected or first available variant
@param {image} card_image - Variant image or product image
@param {string[]} style_hooks - Existing audited CSS classes in document order
@param {string} cta_text - Original CTA copy
{% enddoc %}
'''
(root/'theme-dev/snippets/fem-product-card.liquid').write_text(header+base+'\n')
index=0
def substitute(m):
 global index
 f=m[0];product=re.search(r'product_[A-Za-z0-9]+',f)[0]
 cta='ver producto' if index==0 else 'Ver producto';index+=1
 return "{% assign card_style_hooks = '"+','.join(classes(f))+"' | split: ',' %}\n{% render 'fem-product-card', card_product: "+product+", card_variant: "+product+"_variant, card_image: "+product+"_image, style_hooks: card_style_hooks, cta_text: '"+cta+"' %}"
source=re.sub(pattern,substitute,source);path.write_text(source)
print('Product cards: 8 → 1 reusable snippet')

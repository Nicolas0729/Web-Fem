/** Refresh server-rendered fields in place, preserving focus, gallery position and listeners. */
export function patchProductMarkup(current:HTMLElement,fresh:HTMLElement):void {
  const scope='[data-fem-form-product-url]';
  const key=(node:Element)=>[node.tagName,node.getAttribute('class')??'',node.getAttribute('data-fem-repeater-index')??''].join('|');
  const targets=new Map<string,Element[]>();
  for(const node of fresh.querySelectorAll('*')){
    if(node.closest(scope)!==fresh)continue;
    const list=targets.get(key(node))??[];list.push(node);targets.set(key(node),list);
  }
  for(const node of current.querySelectorAll<HTMLElement>('*')){
    if(node.closest(scope)!==current)continue;
    const candidate=targets.get(key(node))?.shift();if(!candidate)continue;
    const dynamic=node.dataset.femDynamicContentSource;
    if(dynamic && ['TITLE','PRICE','COMPARE_AT','SAVED_PERCENTAGE','DESCRIPTION','QUANTITY_AVAILABLE','VENDOR'].includes(dynamic))node.innerHTML=candidate.innerHTML;
    if(node.hasAttribute('data-fem-conditional'))node.style.cssText=candidate.getAttribute('style')??'';
    if(node.matches('a[data-fem-href],a[data-fem-action-type^="add-to-"]')){
      const href=candidate.getAttribute('href');if(href)node.setAttribute('href',href);
    }
    for(const attribute of ['data-fem-disabled','data-fem-action-variant-id']){
      const value=candidate.getAttribute(attribute);if(value!==null)node.setAttribute(attribute,value);else node.removeAttribute(attribute);
    }
    if(node instanceof HTMLImageElement && dynamic){
      for(const attribute of ['src','srcset','sizes','alt','width','height']){const value=candidate.getAttribute(attribute);if(value!==null)node.setAttribute(attribute,value);else node.removeAttribute(attribute);}
    }
  }
}

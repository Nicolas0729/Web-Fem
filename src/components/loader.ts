interface ModuleRegistration { selector: string; src: string }
const loaded = new Set<string>();
const registered = new WeakSet<HTMLScriptElement>();
const modules = new Map<string,ModuleRegistration>();
export async function loadPresentComponents(root: ParentNode = document,includeHidden=false): Promise<void> {
  const requests:Promise<unknown>[]=[];
  const registrations=[...root.querySelectorAll<HTMLScriptElement>('script[data-fem-module]')];
  if(root instanceof HTMLScriptElement && root.hasAttribute('data-fem-module'))registrations.push(root);
  for(const registration of registrations){
    if(registered.has(registration))continue;
    registered.add(registration);
    const entry: ModuleRegistration = {selector: registration.dataset.femModule ?? '', src: registration.dataset.src ?? ''};
    if(entry.selector && entry.src)modules.set(entry.src,entry);
  }
  for(const entry of modules.values()){
    if(loaded.has(entry.src))continue;
    const candidates=[...root.querySelectorAll(entry.selector)];
    if(root instanceof Element && root.matches(entry.selector))candidates.push(root);
    if(!candidates.some(element=>includeHidden || !element.closest('dialog:not([open])')))continue;
    loaded.add(entry.src);
    requests.push(import(/* @vite-ignore */ entry.src).catch(error => {
      loaded.delete(entry.src);
      console.error(`No se pudo cargar ${entry.selector}`, error);
    }));
  }
  await Promise.all(requests);
}

export function bindLazySearchShortcut():void {
  document.addEventListener('keydown',event=>{
    if(!event.metaKey || event.key!=='k' || customElements.get('predictive-search-component'))return;
    const panel=document.getElementById('search-modal') as (HTMLElement & {toggleDialog?:()=>void})|null;
    if(!panel)return;
    event.preventDefault();
    void loadPresentComponents(panel,true).then(()=>panel.toggleDialog?.());
  });
}

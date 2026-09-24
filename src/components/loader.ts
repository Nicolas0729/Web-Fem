interface ModuleRegistration { selector: string; src: string }
const loaded = new Set<string>();
export function loadPresentComponents(root: ParentNode = document): void {
  document.querySelectorAll<HTMLScriptElement>('script[data-fem-module]').forEach(registration => {
    const entry: ModuleRegistration = {selector: registration.dataset.femModule ?? '', src: registration.dataset.src ?? ''};
    if (!entry.selector || !entry.src || loaded.has(entry.src)) return;
    const present = root instanceof Element && root.matches(entry.selector) || root.querySelector(entry.selector);
    if (!present) return;
    loaded.add(entry.src);
    void import(/* @vite-ignore */ entry.src).catch(error => {
      loaded.delete(entry.src);
      console.error(`No se pudo cargar ${entry.selector}`, error);
    });
  });
}

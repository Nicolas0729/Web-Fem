const labels: Record<string,string> = {'magnifying-glass':'Buscar productos','instagram-logo':'Instagram de Fem','tiktok-logo':'TikTok de Fem','caret-left':'Anterior','caret-right':'Siguiente','arrow-left':'Anterior','arrow-right':'Siguiente','shopping-cart':'Ver carrito','list':'Abrir menú','x':'Cerrar','whatsapp-logo':'Contactar por WhatsApp'};
export function enhanceAccessibility(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('a,button').forEach(control => {
    if (control.hasAttribute('aria-label')) return;
    const text = control.cloneNode(true) as HTMLElement;
    text.querySelectorAll('svg').forEach(svg => svg.remove());
    if (text.textContent?.trim()) return;
    const icon = control.querySelector('svg title')?.textContent?.trim() ?? '';
    const name = labels[icon] ?? (control.getAttribute('href') === '/' ? 'Fem — Inicio' : '');
    if (name) control.setAttribute('aria-label', name);
  });
  root.querySelectorAll<HTMLElement>('[data-instant-action-type="open-dropdown"],[data-instant-action-type="open-overlay"]').forEach(button => {
    button.setAttribute('aria-expanded', String(button.dataset.instantState === 'active'));
  });
}

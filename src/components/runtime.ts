import {enhanceCommunityVideos} from './community-video.ts';
import {loadPresentComponents} from './loader.ts';
import {enhanceAccessibility} from './accessibility.ts';
function boot(): void {
  loadPresentComponents();
  enhanceAccessibility();
  enhanceCommunityVideos();
  document.documentElement.classList.remove('no-js');
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes' && record.target instanceof HTMLElement) {
        record.target.setAttribute('aria-expanded', String(record.target.dataset.instantState === 'active'));
      }
      for (const added of record.addedNodes) if (added instanceof Element) {
        loadPresentComponents(added);
        enhanceAccessibility(added);
        enhanceCommunityVideos(added);
      }
    }
  }).observe(document.body, {childList:true,subtree:true,attributes:true,attributeFilter:['data-instant-state']});
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();

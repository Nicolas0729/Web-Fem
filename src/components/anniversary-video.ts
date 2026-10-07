const initialized = new WeakSet<Element>();

export function enhanceAnniversaryVideo(root: ParentNode = document): void {
  const banners = [...root.querySelectorAll<HTMLElement>('.fem-anniversary')];
  if (root instanceof HTMLElement && root.matches('.fem-anniversary')) banners.push(root);
  for (const banner of banners) {
    if (initialized.has(banner)) continue;
    const video = banner.querySelector<HTMLVideoElement>('.fem-anniversary__video');
    const button = banner.querySelector<HTMLButtonElement>('.fem-anniversary__playback');
    if (!video || !button) continue;
    initialized.add(banner);
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let wantsPlayback = !motion.matches;
    let inView = false;
    video.muted = true;
    video.playsInline = true;
    button.hidden = false;
    const updateLabel = () => {
      button.textContent = (video.paused ? button.dataset.playLabel : button.dataset.pauseLabel) ?? '';
    };
    const syncPlayback = () => {
      if (!banner.isConnected || !inView || document.hidden || !wantsPlayback) video.pause();
      else void video.play().catch(updateLabel);
    };
    video.addEventListener('loadeddata', () => { video.dataset.ready = ''; });
    video.addEventListener('play', updateLabel);
    video.addEventListener('pause', updateLabel);
    video.addEventListener('error', () => { delete video.dataset.ready; button.hidden = true; });
    button.addEventListener('click', () => {
      wantsPlayback = video.paused;
      syncPlayback();
    });
    const onMotionChange = () => { wantsPlayback = !motion.matches; syncPlayback(); };
    document.addEventListener('visibilitychange', syncPlayback);
    motion.addEventListener('change', onMotionChange);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        inView = entries[0].isIntersecting;
        syncPlayback();
        if (!banner.isConnected) {
          observer.disconnect();
          document.removeEventListener('visibilitychange', syncPlayback);
          motion.removeEventListener('change', onMotionChange);
        }
      });
      observer.observe(banner);
    } else { inView = true; syncPlayback(); }
  }
}

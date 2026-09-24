/** Keep social videos usable when a browser refuses muted autoplay. */
const initialized = new WeakSet<HTMLVideoElement>();
export function enhanceCommunityVideos(root: ParentNode = document): void {
  const videos = [...root.querySelectorAll<HTMLVideoElement>('video.instant-video-fill__video')];
  if (root instanceof HTMLVideoElement && root.matches('.instant-video-fill__video')) videos.push(root);
  for (const video of videos) {
    if (initialized.has(video)) continue;
    initialized.add(video);
    const wrapper = video.parentElement;
    if (!wrapper) continue;
    video.muted = true;
    video.playsInline = true;
    video.controls = true;
    video.setAttribute('aria-label', 'Video de la comunidad Fem');
    wrapper.classList.add('fem-community-video');
    const fallback = wrapper.querySelector<HTMLElement>('.instant-video__fallback');
    const ready = () => { if (fallback) fallback.hidden = true; };
    video.addEventListener('loadeddata', ready);
    if (video.readyState >= 2) ready();
    // Failure is expected on browsers with autoplay restrictions: native controls remain available.
    if (video.autoplay && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      void video.play().catch(() => { video.controls = true; });
    } else {
      video.autoplay = false;
      video.pause();
    }
  }
}

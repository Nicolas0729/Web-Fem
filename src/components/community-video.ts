const initialized = new WeakSet<HTMLVideoElement>();
const playback = new WeakMap<HTMLVideoElement,{autoplay:boolean;started:boolean}>();
function activate(video:HTMLVideoElement):void {
  if (video.dataset.femVideoSrc) {
    video.src=video.dataset.femVideoSrc;
    delete video.dataset.femVideoSrc;
    video.preload='metadata';
    video.load();
  }
}
const nearby = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries=>{
  for (const entry of entries) if(entry.isIntersecting){
    activate(entry.target as HTMLVideoElement);
    nearby?.unobserve(entry.target);
  }
},{rootMargin:'200px 0px'});
const visible = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries=>{
  for(const entry of entries){
    const video=entry.target as HTMLVideoElement;
    const state=playback.get(video)!;
    if(entry.isIntersecting && entry.intersectionRatio>=.25){
      activate(video);
      if(state.autoplay && !state.started && !matchMedia('(prefers-reduced-motion: reduce)').matches){
        state.started=true;
        void video.play().catch(()=>{});
      }
    } else if(!video.paused) video.pause();
  }
},{threshold:[0,.25]});
export function enhanceCommunityVideos(root: ParentNode = document): void {
  const selector='video.fem-community-video__media,video.fem-view-video-fill__video';
  const videos = [...root.querySelectorAll<HTMLVideoElement>(selector)];
  if (root instanceof HTMLVideoElement && root.matches(selector)) videos.push(root);
  for (const video of videos) {
    if (initialized.has(video)) continue;
    initialized.add(video);
    const wrapper = video.parentElement;
    if (!wrapper) continue;
    video.muted = true;
    video.playsInline = true;
    video.controls = true;
    const autoplay=video.autoplay || video.dataset.femAutoplay==='true';
    video.autoplay=false;
    video.preload='none';
    playback.set(video,{autoplay,started:false});
    video.setAttribute('aria-label', 'Video de la comunidad Fem');
    wrapper.classList.add('fem-community-video');
    const fallback = wrapper.querySelector<HTMLElement>('.fem-community-video__fallback,.fem-view-video__fallback');
    const ready = () => { if (fallback) fallback.hidden = true; };
    video.addEventListener('loadeddata', ready);
    if (video.readyState >= 2) ready();
    video.addEventListener('pointerdown',()=>activate(video),{once:true});
    video.addEventListener('focus',()=>activate(video),{once:true});
    if(nearby && visible){nearby.observe(video);visible.observe(video);}
    else activate(video);
  }
}

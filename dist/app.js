(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const previousButton = document.querySelector('#prevButton');
  const nextButton = document.querySelector('#nextButton');
  const fullscreenButton = document.querySelector('#fullscreenButton');
  const counter = document.querySelector('#slideCounter');
  const progress = document.querySelector('#progressBar');
  const dots = document.querySelector('#slideDots');
  const chapterLabel = document.querySelector('#chapterLabel');
  const chapterButtons = [...document.querySelectorAll('.story-rail button')];
  const brandAudio = document.querySelector('#brandAudio');
  const soundOnboarding = document.querySelector('#soundOnboarding');
  const startSoundButton = document.querySelector('#startSound');
  const skipSoundButton = document.querySelector('#skipSound');
  const audioPlayer = document.querySelector('#audioPlayer');
  const audioToggle = document.querySelector('#audioToggle');
  const audioClose = document.querySelector('#audioClose');
  const audioBack = document.querySelector('#audioBack');
  const audioPlay = document.querySelector('#audioPlay');
  const audioForward = document.querySelector('#audioForward');
  const audioSeek = document.querySelector('#audioSeek');
  const audioMute = document.querySelector('#audioMute');
  const audioVolume = document.querySelector('#audioVolume');
  const audioTime = document.querySelector('#audioTime');
  const slideVideos = [...document.querySelectorAll('[data-slide-video]')];
  let current = Math.min(Math.max((Number(location.hash.replace('#slide-', '')) || 1) - 1, 0), slides.length - 1);
  let touchStartX = null;
  let transitionTimer;
  let soundEnabled = false;
  let preferredMusicVolume = Number(audioVolume.value);
  let musicFadeFrame = null;

  slides.forEach((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `Go to slide ${index + 1}`);
    button.addEventListener('click', () => showSlide(index));
    dots.appendChild(button);
  });
  chapterButtons.forEach((button) => button.addEventListener('click', () => showSlide(Number(button.dataset.target) - 1)));

  function showSlide(next, updateHash = true) {
    next = Math.min(Math.max(next, 0), slides.length - 1);
    if (next === current && slides[current].classList.contains('is-active')) return;
    clearTimeout(transitionTimer);
    const outgoing = slides[current];
    const incoming = slides[next];
    const forward = next > current;
    outgoing.classList.remove('is-active');
    outgoing.classList.toggle('is-leaving-left', forward);
    incoming.hidden = false;
    incoming.classList.remove('is-leaving-left');
    incoming.style.transform = forward ? 'translateX(30px)' : 'translateX(-30px)';
    requestAnimationFrame(() => requestAnimationFrame(() => { incoming.style.transform = ''; incoming.classList.add('is-active'); }));
    const oldIndex = current;
    current = next;
    transitionTimer = setTimeout(() => { if (oldIndex !== current) slides[oldIndex].hidden = true; slides[oldIndex].classList.remove('is-leaving-left'); }, 540);
    updateUI();
    if (updateHash) history.replaceState(null, '', `#slide-${current + 1}`);
  }

  function updateUI() {
    const slide = slides[current];
    const display = String(current + 1).padStart(2, '0');
    counter.textContent = `${display} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    previousButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    document.body.dataset.slide = String(current + 1);
    chapterLabel.textContent = slide.dataset.chapter.toUpperCase();
    [...dots.children].forEach((dot, index) => { dot.classList.toggle('is-active', index === current); dot.setAttribute('aria-current', index === current ? 'true' : 'false'); });
    chapterButtons.forEach((button, index) => {
      const start = Number(button.dataset.target) - 1;
      const nextStart = index < chapterButtons.length - 1 ? Number(chapterButtons[index + 1].dataset.target) - 1 : slides.length;
      button.classList.toggle('is-active', current >= start && current < nextStart);
    });
    syncSlideMedia();
    syncAudioMix();
    document.title = `${current + 1}/${slides.length} — The Next Chapter of Our Brand`;
  }

  function syncSlideMedia() {
    slideVideos.forEach((video) => {
      const isActive = video.closest('.slide') === slides[current];
      startVideoEdgeSampler(video);
      video.volume = 0.5;
      video.dataset.outputVolume = '0.5';
      if (isActive) {
        video.muted = !soundEnabled;
        video.dataset.outputMuted = String(video.muted);
        video.currentTime = 0;
        video.play().catch(() => {
          video.muted = true;
          video.dataset.outputMuted = 'true';
          video.play().catch(() => {});
        });
      } else {
        video.pause();
        video.currentTime = 0;
        video.muted = true;
        video.dataset.outputMuted = 'true';
      }
    });
  }

  function startVideoEdgeSampler(video) {
    if (video.dataset.edgeSamplerStarted === 'true') return;
    video.dataset.edgeSamplerStarted = 'true';
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 2;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    const slide = video.closest('.slide--sonic-film');

    const averageRow = (pixels, row) => {
      let red = 0;
      let green = 0;
      let blue = 0;
      const offset = row * canvas.width * 4;
      for (let x = 0; x < canvas.width; x += 1) {
        const index = offset + (x * 4);
        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
      }
      return `rgb(${Math.round(red / canvas.width)}, ${Math.round(green / canvas.width)}, ${Math.round(blue / canvas.width)})`;
    };

    const sampleEdges = () => {
      if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
        try {
          const sourceBand = Math.min(6, video.videoHeight);
          context.drawImage(video, 0, 0, video.videoWidth, sourceBand, 0, 0, canvas.width, 1);
          context.drawImage(video, 0, video.videoHeight - sourceBand, video.videoWidth, sourceBand, 0, 1, canvas.width, 1);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const topColor = averageRow(pixels, 0);
          const bottomColor = averageRow(pixels, 1);
          slide.style.setProperty('--video-edge-top', topColor);
          slide.style.setProperty('--video-edge-bottom', bottomColor);
          video.dataset.edgeTop = topColor;
          video.dataset.edgeBottom = bottomColor;
        } catch (_) {}
      }
      if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(sampleEdges);
      else requestAnimationFrame(sampleEdges);
    };

    if (video.readyState >= 2) sampleEdges();
    else video.addEventListener('loadeddata', sampleEdges, { once: true });
  }

  function isSonicFilmSlide() {
    return slides[current]?.dataset.slide === '13';
  }

  function fadeMusicTo(target, duration = 700) {
    if (musicFadeFrame) cancelAnimationFrame(musicFadeFrame);
    const destination = Math.min(Math.max(target, 0), 1);
    const startVolume = brandAudio.volume;
    if (!duration || Math.abs(startVolume - destination) < 0.002) {
      brandAudio.volume = destination;
      brandAudio.dataset.mixVolume = destination.toFixed(3);
      musicFadeFrame = null;
      return;
    }
    const startedAt = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = progress * progress * (3 - (2 * progress));
      brandAudio.volume = startVolume + ((destination - startVolume) * eased);
      brandAudio.dataset.mixVolume = brandAudio.volume.toFixed(3);
      if (progress < 1) musicFadeFrame = requestAnimationFrame(step);
      else musicFadeFrame = null;
    };
    musicFadeFrame = requestAnimationFrame(step);
  }

  function syncAudioMix(immediate = false) {
    fadeMusicTo(isSonicFilmSlide() ? 0 : preferredMusicVolume, immediate ? 0 : 700);
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
  }

  function updateAudioUI() {
    const duration = Number.isFinite(brandAudio.duration) ? brandAudio.duration : 0;
    const position = duration ? (brandAudio.currentTime / duration) * 100 : 0;
    const playing = !brandAudio.paused;
    audioSeek.value = String(position);
    audioTime.textContent = `${formatTime(brandAudio.currentTime)} / ${formatTime(duration)}`;
    audioPlay.textContent = playing ? 'Ⅱ' : '▶';
    audioPlay.setAttribute('aria-label', playing ? 'Pause soundtrack' : 'Play soundtrack');
    audioPlayer.classList.toggle('is-playing', playing);
    audioMute.textContent = brandAudio.muted || brandAudio.volume === 0 ? 'SOUND OFF' : 'SOUND ON';
    audioMute.setAttribute('aria-label', brandAudio.muted ? 'Unmute soundtrack' : 'Mute soundtrack');
  }

  function dismissSoundOnboarding() {
    soundOnboarding.hidden = true;
  }

  async function playSoundtrack() {
    soundEnabled = true;
    syncAudioMix(isSonicFilmSlide());
    try {
      await brandAudio.play();
    } catch (_) {
      audioPlayer.classList.add('is-open');
      audioToggle.setAttribute('aria-expanded', 'true');
    }
    syncSlideMedia();
    updateAudioUI();
  }

  function toggleFullscreen() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); }
  previousButton.addEventListener('click', () => showSlide(current - 1));
  nextButton.addEventListener('click', () => showSlide(current + 1));
  fullscreenButton.addEventListener('click', toggleFullscreen);
  brandAudio.volume = preferredMusicVolume;
  brandAudio.dataset.mixVolume = preferredMusicVolume.toFixed(3);
  startSoundButton.addEventListener('click', () => { dismissSoundOnboarding(); playSoundtrack(); });
  skipSoundButton.addEventListener('click', () => { soundEnabled = false; slideVideos.forEach((video) => { video.muted = true; }); dismissSoundOnboarding(); });
  audioToggle.addEventListener('click', () => {
    const open = !audioPlayer.classList.contains('is-open');
    audioPlayer.classList.toggle('is-open', open);
    audioToggle.setAttribute('aria-expanded', String(open));
    audioToggle.setAttribute('aria-label', open ? 'Close soundtrack controls' : 'Open soundtrack controls');
  });
  audioClose.addEventListener('click', () => {
    audioPlayer.classList.remove('is-open');
    audioToggle.setAttribute('aria-expanded', 'false');
    audioToggle.setAttribute('aria-label', 'Open soundtrack controls');
    audioToggle.focus();
  });
  audioPlay.addEventListener('click', () => { if (brandAudio.paused) playSoundtrack(); else brandAudio.pause(); });
  audioBack.addEventListener('click', () => { brandAudio.currentTime = Math.max(0, brandAudio.currentTime - 10); });
  audioForward.addEventListener('click', () => { brandAudio.currentTime = Math.min(brandAudio.duration || Infinity, brandAudio.currentTime + 10); });
  audioSeek.addEventListener('input', () => { if (Number.isFinite(brandAudio.duration)) brandAudio.currentTime = (Number(audioSeek.value) / 100) * brandAudio.duration; });
  audioVolume.addEventListener('input', () => {
    preferredMusicVolume = Number(audioVolume.value);
    soundEnabled = true;
    brandAudio.muted = false;
    if (isSonicFilmSlide()) brandAudio.volume = 0;
    else brandAudio.volume = preferredMusicVolume;
    brandAudio.dataset.mixVolume = brandAudio.volume.toFixed(3);
    slideVideos.forEach((video) => {
      if (video.closest('.slide') === slides[current]) {
        video.muted = false;
        video.dataset.outputMuted = 'false';
      }
    });
  });
  audioMute.addEventListener('click', () => { brandAudio.muted = !brandAudio.muted; });
  brandAudio.addEventListener('loadedmetadata', updateAudioUI);
  brandAudio.addEventListener('timeupdate', updateAudioUI);
  brandAudio.addEventListener('play', updateAudioUI);
  brandAudio.addEventListener('pause', updateAudioUI);
  brandAudio.addEventListener('volumechange', updateAudioUI);
  document.addEventListener('fullscreenchange', () => { const active = Boolean(document.fullscreenElement); fullscreenButton.setAttribute('aria-label', active ? 'Exit fullscreen' : 'Enter fullscreen'); fullscreenButton.title = active ? 'Exit fullscreen (F)' : 'Fullscreen (F)'; });
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof Element && event.target.closest('button, input, video, audio, a')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); showSlide(current + 1); }
    else if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); showSlide(current - 1); }
    else if (event.key === 'Home') { event.preventDefault(); showSlide(0); }
    else if (event.key === 'End') { event.preventDefault(); showSlide(slides.length - 1); }
    else if (event.key.toLowerCase() === 'f') { event.preventDefault(); toggleFullscreen(); }
  });
  document.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (event) => { if (touchStartX === null) return; const distance = event.changedTouches[0].clientX - touchStartX; if (Math.abs(distance) > 55) showSlide(current + (distance < 0 ? 1 : -1)); touchStartX = null; }, { passive: true });
  window.addEventListener('hashchange', () => { const requested = Number(location.hash.replace('#slide-', '')) - 1; if (Number.isInteger(requested)) showSlide(requested, false); });
  slides.forEach((slide, index) => { slide.hidden = index !== current; slide.classList.toggle('is-active', index === current); });
  updateUI();
  updateAudioUI();
})();

// ==========================================================================
// TEIKO - MAIN SCRIPT (GSAP ScrollTrigger & Lenis Smooth Scroll Integration)
// ==========================================================================

// 1. Initialize Lenis Smooth Scroll
let lenis;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    // lerp (bukan duration): tiap frame mendekati target 7%, terasa lebih halus & kontinu saat scroll mouse/trackpad.
    // Di HP tetap scroll bawaan (paling mulus di layar sentuh).
    lerp: 0.07,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 0.9,
    touchMultiplier: 2,
    infinite: false,
  });

  // Sync Lenis with GSAP ScrollTrigger (avoiding duplicate rAF loop to prevent forced reflow / layout thrashing)
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);
  } else {
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
}

// 2. GSAP Animations for Hero & Editorial Grid
// Reveal hero text/buttons dan beverage box pas halaman/scroll load pertama kali.
function initGsapAnimations() {
  if (typeof gsap === 'undefined') return;

  // Hero Product Body (quote, image, tags) — stagger reveal
  const heroBody = document.querySelector('.hero-product__body');
  if (heroBody) {
    gsap.fromTo(
      heroBody.children,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.22,
        ease: 'power2.out',
        delay: 0.5
      }
    );
  }

  // Hero Product Actions (buttons)
  const heroActions = document.querySelector('.hero-product__actions');
  if (heroActions) {
    gsap.fromTo(
      heroActions.children,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out', delay: 0.8 }
    );
  }

  // ScrollTrigger Stagger Reveal for Beverage Boxes
  const revealItems = gsap.utils.toArray('.gsap-reveal');
  if (revealItems.length > 0 && typeof ScrollTrigger !== 'undefined') {
    revealItems.forEach((box, index) => {
      gsap.fromTo(
        box,
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: box,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true
          }
        }
      );
    });
  }
}

// 3. Hero Carousel & Supabase Content Loader
let heroSlides = [];
let currentSlideIdx = 0;
let heroCarouselTimer = null;
let newsItems = [];

// === HERO DRINK SLIDES (Kubah Hijau Atas) ===
let drinkSlides = [];
let currentDrinkIdx = 0;
let drinkSlideTimer = null;
let drinkSlidesLoaded = false;
let drinkDisplayOn = null; // null = status saklar belum diketahui

// Kubah hijau (#hero1-section) tersembunyi dari HTML. Baru tampil kalau saklar
// Display Minuman ON *dan* ada slide aktif. Selain itu (OFF, kosong, error) tidak pernah muncul.
function updateDrinkHero() {
  const el = document.getElementById('hero1-section');
  if (!el) return;
  const show = drinkDisplayOn === true && drinkSlidesLoaded && drinkSlides.length > 0;
  el.style.display = show ? '' : 'none';
  if (typeof ScrollTrigger !== 'undefined') setTimeout(() => ScrollTrigger.refresh(), 100);
}

// Ambil daftar minuman buat slideshow "kubah hijau" (hero_drink_slides table).
// Kosong/error: drinkSlides = [] dan kubah tetap tersembunyi (lihat updateDrinkHero).
async function loadDrinkSlides() {

  try {
    if (typeof sb !== 'undefined') {
      const { data, error } = await sb
        .from('hero_drink_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      drinkSlides = (!error && data) ? data : [];
    }
  } catch (err) {
    console.warn('hero_drink_slides tidak bisa dimuat:', err.message);
    drinkSlides = [];
  }
  // Tidak ada slide aktif / gagal dimuat: kubah hijau tetap tersembunyi, tanpa minuman default.
  drinkSlidesLoaded = true;
  updateDrinkHero();
  if (!drinkSlides.length) return;

  renderDrinkSlide(0, false);
  startDrinkSlideTimer();
  buildDrinkDots();
}

// Bikin tombol titik navigasi buat slideshow minuman, satu titik per slide.
function buildDrinkDots() {
  const dotsContainer = document.getElementById('hero-carousel-dots');
  if (!dotsContainer || drinkSlides.length <= 1) return;
  dotsContainer.style.display = 'flex';
  dotsContainer.innerHTML = drinkSlides.map((_, i) =>
    `<button class="hero-dot ${i === 0 ? 'active' : ''}" data-slide="${i}" aria-label="Slide ${i+1}"></button>`
  ).join('');
  dotsContainer.querySelectorAll('.hero-dot').forEach((dot, i) => {
    dot.addEventListener('click', () => {
      clearInterval(drinkSlideTimer);
      renderDrinkSlide(i, true);
      startDrinkSlideTimer();
    });
  });
}

// Tampilin satu slide minuman (gambar, judul, quote) di posisi idx.
// animate=true pake fade GSAP, false langsung ganti (dipakai pas load pertama).
function renderDrinkSlide(idx, animate = true) {
  if (!drinkSlides || drinkSlides.length === 0) return;
  currentDrinkIdx = idx % drinkSlides.length;
  const slide = drinkSlides[currentDrinkIdx];

  const imgEl   = document.getElementById('es-coklat-cup-img');
  const titleEl = document.getElementById('hero1-title');
  const quoteEl = document.querySelector('.hero-product__quote-text');
  const dotsContainer = document.getElementById('hero-carousel-dots');

  // Update dots
  if (dotsContainer) {
    dotsContainer.querySelectorAll('.hero-dot').forEach((d, i) =>
      d.classList.toggle('active', i === currentDrinkIdx)
    );
  }

  if (!animate || typeof gsap === 'undefined') {
    if (imgEl)   imgEl.src = slide.image_url || '';
    if (titleEl) titleEl.textContent = slide.name || 'NEW MENU';
    if (quoteEl && slide.subtitle) quoteEl.textContent = slide.subtitle;
    return;
  }

  // Animate: fade out → update → fade in
  const els = [imgEl, titleEl, quoteEl].filter(Boolean);
  gsap.to(els, {
    opacity: 0, y: -12, duration: 0.35, ease: 'power2.in',
    onComplete: () => {
      if (imgEl)   imgEl.src = slide.image_url || '';
      if (titleEl) titleEl.innerHTML = (slide.name || 'NEW MENU').replace(/\n/g, '<br>');
      if (quoteEl && slide.subtitle) quoteEl.textContent = slide.subtitle;
      gsap.fromTo(els,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', stagger: 0.08 }
      );
    }
  });
}

// Jalanin auto-rotate slideshow minuman tiap 4.5 detik.
function startDrinkSlideTimer() {
  clearInterval(drinkSlideTimer);
  if (drinkSlides.length <= 1) return;
  drinkSlideTimer = setInterval(() => {
    renderDrinkSlide(currentDrinkIdx + 1, true);
  }, 4500);
}

// Tampilin satu hero banner (carousel lebar promo) di posisi index.
function renderHeroSlide(index, animate = true) {
  if (!heroSlides || heroSlides.length === 0) return;
  currentSlideIdx = index % heroSlides.length;
  const slide = heroSlides[currentSlideIdx];

  const bannerImgEl = document.getElementById('hero-banner-img');
  const overlayImgEl = document.getElementById('hero-banner-img-overlay');
  const bannerLinkEl = document.getElementById('hero-banner-link');
  const bannerDots = document.querySelectorAll('.fullwidth-banner-dots .banner-dot');

  const targetBanner = slide.image_url;

  // Cuma bisa diklik kalau admin isi "Link Tujuan Klik" di section ini. Kosong = gambar statis, gak nge-link kemana-mana.
  const targetUrl = (slide.button_url && slide.button_url.trim() !== '' && slide.button_url !== '#' && slide.button_url !== 'javascript:void(0)') ? slide.button_url : null;
  if (bannerLinkEl) {
    bannerLinkEl.href = targetUrl || 'javascript:void(0)';
    bannerLinkEl.style.cursor = targetUrl ? 'pointer' : 'default';
  }
  const trackEl = document.querySelector('.fullwidth-banner-track');
  if (trackEl) {
    trackEl.style.cursor = targetUrl ? 'pointer' : 'default';
    trackEl.onclick = (e) => {
      if (targetUrl && !e.target.closest('.fullwidth-banner-dots')) {
        window.location.href = targetUrl;
      }
    };
  }
  bannerDots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlideIdx);
  });

  if (!animate || typeof gsap === 'undefined' || !bannerImgEl || !overlayImgEl) {
    if (bannerImgEl) {
      bannerImgEl.src = targetBanner;
      bannerImgEl.style.opacity = '1';
    }
    if (overlayImgEl) overlayImgEl.style.opacity = '0';
    return;
  }

  // Cinematic cross-fade with gentle Ken Burns scale effect
  gsap.killTweensOf([bannerImgEl, overlayImgEl]);
  overlayImgEl.src = targetBanner;

  gsap.fromTo(overlayImgEl,
    { opacity: 0, scale: 1.03 },
    {
      opacity: 1,
      scale: 1,
      duration: 1.2,
      ease: 'power2.inOut',
      onComplete: () => {
        bannerImgEl.src = targetBanner;
        bannerImgEl.style.opacity = '1';
        overlayImgEl.style.opacity = '0';
        overlayImgEl.style.transform = 'scale(1)';
      }
    }
  );

  gsap.to(bannerImgEl, {
    opacity: 0.2,
    duration: 1.2,
    ease: 'power2.inOut'
  });
}

// Bikin titik navigasi buat hero carousel & jalanin auto-rotate.
function initHeroCarousel() {
  const dotsContainer = document.getElementById('fullwidth-banner-dots');
  if (dotsContainer && heroSlides && heroSlides.length > 0) {
    dotsContainer.innerHTML = '';
    if (heroSlides.length > 1) {
      heroSlides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = `banner-dot${i === currentSlideIdx ? ' active' : ''}`;
        dot.setAttribute('data-slide', i);
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => {
          resetHeroCarouselTimer();
          renderHeroSlide(i, true);
        });
        dotsContainer.appendChild(dot);
      });
    }
  }

  if (!heroSlides || heroSlides.length <= 1) return;
  startHeroCarouselTimer();
}

// Jalanin auto-rotate hero carousel tiap 5 detik.
function startHeroCarouselTimer() {
  if (heroCarouselTimer) clearInterval(heroCarouselTimer);
  heroCarouselTimer = setInterval(() => {
    if (heroSlides.length > 1) {
      renderHeroSlide(currentSlideIdx + 1, true);
    }
  }, 4500);
}

// Restart timer auto-rotate (dipanggil abis user klik dot manual).
function resetHeroCarouselTimer() {
  if (heroCarouselTimer) clearInterval(heroCarouselTimer);
  startHeroCarouselTimer();
}

// Ambil semua konten homepage dari site_content (hero banner, kategori
// minuman, kotak promo) sekali jalan, terus render ke section masing-masing.
async function loadContent() {
  try {
    if (typeof sb === 'undefined') return;
    const { data, error } = await sb.from('site_content').select('*');
    if (error) throw error;

    heroSlides = [];
    newsItems = [];
    let foundDrinkDisplay = null;

    data.forEach(s => {
      if (s.id === 'hero_drink_display') {
        foundDrinkDisplay = s;
        return;
      }

      // Kumpulin berita aktif (id "news_*") buat section News di homepage.
      if (s.id.startsWith('news_')) {
        if (s.is_active !== false) newsItems.push(s);
        return;
      }

      // Collect active heroes for carousel (hero1, hero2, hero3, and any dynamic hero_... added from admin)
      if (s.id === 'hero1' || s.id === 'hero2' || s.id === 'hero3' || (s.id.startsWith('hero') && s.id !== 'hero_drink_display')) {
        if (s.is_active !== false && s.image_url) {
          heroSlides.push(s);
        }
        return;
      }

      // Handle PROMO BOXES (4-grid bawah homepage)
      const promoMap = {
        'promo_box_1': 'promo-box-1-img',
        'promo_box_2': 'promo-box-2-img',
        'promo_box_3': 'promo-box-3-img',
        'promo_box_4': 'promo-box-4-img'
      };
      if (promoMap[s.id]) {
        const promoImg = document.getElementById(promoMap[s.id]);
        const promoCard = promoImg ? promoImg.closest('a') : null;
        if (promoCard && s.image_url && s.is_active !== false) {
          promoImg.src = s.image_url;
          if (s.button_url) promoCard.href = s.button_url;
          promoCard.style.display = '';
        }
      }
    });

    // Display Minuman (kubah hijau) bisa dimatikan dari admin (Kelola Konten).
    // Kalau OFF, hero disembunyikan dan slider foto landscape (hero1, hero2, ...) jadi pembuka halaman.
    drinkDisplayOn = !(foundDrinkDisplay && foundDrinkDisplay.is_active === false);
    updateDrinkHero();

    // Sort heroes by id (hero1, hero2, hero3, hero_...)
    heroSlides.sort((a, b) => a.id.localeCompare(b.id));

    // Berita terbaru duluan (id pake timestamp, jadi sort desc = terbaru dulu)
    newsItems.sort((a, b) => b.id.localeCompare(a.id));
    renderNewsSection();

    // Gak ada hero aktif sama sekali (dihapus/off semua) - section disembunyiin
    // total, bukan balik ke foto default. "Hapus" harus beneran keliatan kosong.
    const bannerSection = document.getElementById('fullwidth-hero-banner-section');
    if (heroSlides.length === 0) {
      if (bannerSection) bannerSection.style.display = 'none';
    } else {
      if (bannerSection) bannerSection.style.display = '';
      initHeroCarousel();
      renderHeroSlide(0, false);
    }

    // Refresh ScrollTrigger after content is loaded
    if (typeof ScrollTrigger !== 'undefined') {
      setTimeout(() => ScrollTrigger.refresh(), 300);
    }
  } catch (err) {
    console.warn('Konten tidak dapat dimuat dari database Supabase:', err.message);
    // Gagal muat: kubah & banner tetap tersembunyi, tidak balik ke banner lama.
    drinkDisplayOn = false;
    updateDrinkHero();
  }
}

// Banner promo di HP: geser otomatis ke kanan tiap 3.5 detik, balik ke awal setelah yang terakhir.
// Berhenti sebentar kalau user sedang menggeser sendiri.
function initPromoSlider() {
  const track = document.querySelector('.promo-2box-grid');
  if (!track) return;
  let pausedUntil = 0;
  ['touchstart', 'pointerdown', 'wheel'].forEach(ev =>
    track.addEventListener(ev, () => { pausedUntil = Date.now() + 6000; }, { passive: true }));
  setInterval(() => {
    if (window.innerWidth > 767 || Date.now() < pausedUntil || document.hidden) return;
    const cards = [...track.querySelectorAll('.promo-box-card')].filter(c => c.style.display !== 'none');
    if (cards.length < 2) return;
    const w = track.clientWidth;
    const i = Math.round(track.scrollLeft / w);
    track.scrollTo({ left: i + 1 >= cards.length ? 0 : (i + 1) * w, behavior: 'smooth' });
  }, 3500);
}
document.addEventListener('DOMContentLoaded', initPromoSlider);

// Render section News (lowongan kerja, pindah/buka outlet, dll) di homepage.
// Section disembunyiin total kalau gak ada berita aktif - gak ada dummy/contoh.
function renderNewsSection() {
  const section = document.getElementById('news-section');
  const grid = document.getElementById('news-grid');
  if (!section || !grid) return;

  if (newsItems.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';

  const esc = t => String(t || '').replace(/</g, '&lt;');
  // Ringkasan singkat: paragraf pertama (dipotong lewat CSS).
  const lead = n => esc((n.subtitle || '').trim().split(/\n\s*\n/)[0]);
  // Headline duluan, lalu sisanya; semua jadi satu carousel blok split hijau.
  const items = [...newsItems.filter(n => n.button_text === 'HEADLINE'), ...newsItems.filter(n => n.button_text !== 'HEADLINE')];

  grid.innerHTML = items.map(n => `
    <a class="info-feature" href="news.html?id=${encodeURIComponent(n.id)}">
      ${n.image_url ? `<div class="info-feature__img"><img src="${n.image_url}" alt="${esc(n.title)}" loading="lazy"></div>` : ''}
      <div class="info-feature__body">
        <span class="info-label">Informasi</span>
        <h3>${esc(n.title)}</h3>
        <p>${lead(n)}</p>
        <span class="info-pill info-pill--light">Baca selengkapnya</span>
      </div>
    </a>`).join('');

  const dots = document.getElementById('news-dots');
  if (items.length < 2) { dots.innerHTML = ''; return; }
  dots.innerHTML = items.map((_, i) => `<button aria-label="Informasi ${i + 1}"${i ? '' : ' class="active"'}></button>`).join('');
  const go = i => grid.scrollTo({ left: grid.clientWidth * i, behavior: 'smooth' });
  const current = () => Math.round(grid.scrollLeft / grid.clientWidth);
  dots.querySelectorAll('button').forEach((d, i) => d.addEventListener('click', () => { go(i); restart(); }));
  grid.addEventListener('scroll', () => {
    const c = current();
    dots.querySelectorAll('button').forEach((d, i) => d.classList.toggle('active', i === c));
  }, { passive: true });
  // Geser otomatis tiap 6 detik; berhenti sementara saat disentuh/di-hover.
  let timer;
  const restart = () => { clearInterval(timer); timer = setInterval(() => go((current() + 1) % items.length), 6000); };
  ['pointerenter', 'touchstart'].forEach(e => grid.addEventListener(e, () => clearInterval(timer), { passive: true }));
  ['pointerleave', 'touchend'].forEach(e => grid.addEventListener(e, restart, { passive: true }));
  restart();
}

// 4. Shared page helpers
// Dulu ke-copy paste sendiri-sendiri di faq.html, feedback.html, drinks.html,
// dan event.html. Dipindah ke sini biar cuma ada satu versi.

// Reveal elemen satu-satu (stagger) dengan nambahin class 'visible' bertahap.
// Dipakai buat animasi masuk kartu/section pas halaman baru dimuat.
function staggerAnimate(selector, baseDelay = 0, step = 80) {
  document.querySelectorAll(selector).forEach((el, i) => {
    setTimeout(() => el.classList.add('visible'), baseDelay + i * step);
  });
}

// Buka/tutup satu accordion FAQ, nutup accordion lain yang lagi kebuka.
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');
  document.querySelectorAll('.faq-question').forEach(q => {
    q.classList.remove('open');
    q.nextElementSibling.classList.remove('open');
  });
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
}

// Ambil FAQ aktif dari site_content (id diawali "faq_") dan render ke satu
// container. Dipakai di halaman FAQ.
async function loadFaqFrontend(containerId = 'faq-dynamic-container', animBaseDelay = 150, animStep = 80) {
  const container = document.getElementById(containerId);
  if (!container) return;

  try {
    const { data, error } = await sb.from('site_content')
      .select('*')
      .eq('is_active', true)
      .like('id', 'faq_%');
    if (error) throw error;

    // Kosong dari DB = biarin FAQ default yang udah ada di HTML.
    if (!data || data.length === 0) return;

    data.sort((a, b) => a.id.localeCompare(b.id));

    container.innerHTML = data.map(f => `
      <div class="faq-item anim-item">
        <button class="faq-question" onclick="toggleFaq(this)">
          ${f.title} <i class="bi bi-plus-lg faq-icon"></i>
        </button>
        <div class="faq-answer">
          ${(f.subtitle || '').replace(/\n/g, '<br>')}
        </div>
      </div>
    `).join('');

    setTimeout(() => {
      staggerAnimate(`#${containerId} .faq-item`, animBaseDelay, animStep);
    }, 50);
  } catch (err) {
    console.error('Error loading FAQ:', err);
  }
}

// 5. Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initGsapAnimations();
  loadContent();
  loadDrinkSlides();
});

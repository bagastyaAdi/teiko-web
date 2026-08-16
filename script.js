// ==========================================================================
// TEIKO - MAIN SCRIPT (GSAP ScrollTrigger & Lenis Smooth Scroll Integration)
// ==========================================================================

// 1. Initialize Lenis Smooth Scroll
let lenis;
if (typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
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

// === HERO DRINK SLIDES (Kubah Hijau Atas) ===
let drinkSlides = [];
let currentDrinkIdx = 0;
let drinkSlideTimer = null;

// Ambil daftar minuman buat slideshow "kubah hijau" (hero_drink_slides table).
// Fallback ke defaultDrinkSlides kalau DB kosong/error.
async function loadDrinkSlides() {
  const defaultDrinkSlides = [
    {
      id: 'slide-1',
      name: 'NEW MENU ES COKLAT',
      subtitle: 'Rasanya Enak Banget, Bikin Nagih! Teiko Emang Paling Pas Buat Setiap Momen.',
      image_url: './asset/hero3.png'
    },
    {
      id: 'slide-2',
      name: 'BELGIAN CHOCO ICE',
      subtitle: 'Coklat Belgia pilihan dengan kelembutan yang meleleh di mulut. Nyegerin banget!',
      image_url: './asset/dummy_choco.png'
    },
    {
      id: 'slide-3',
      name: 'GREEN TEA CREAM',
      subtitle: 'Teh hijau asli Jepang berpadu dengan susu creamy. Sensasi tenang di tiap tegukan!',
      image_url: './asset/dummy_matcha.png'
    },
    {
      id: 'slide-4',
      name: 'COFFEE CREAM SPECIAL',
      subtitle: 'Rasa kopi lembut berpadu krim spesial Teiko. Semangat hari-harimu jadi maksimal!',
      image_url: './asset/dummy_coffee.png'
    }
  ];

  try {
    if (typeof sb !== 'undefined') {
      const { data, error } = await sb
        .from('hero_drink_slides')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (!error && data && data.length > 0) {
        drinkSlides = data;
      } else {
        drinkSlides = defaultDrinkSlides;
      }
    } else {
      drinkSlides = defaultDrinkSlides;
    }
  } catch (err) {
    console.warn('hero_drink_slides tidak bisa dimuat, menggunakan default slides:', err.message);
    drinkSlides = defaultDrinkSlides;
  }

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
    if (imgEl)   imgEl.src = slide.image_url || './asset/hero3.png';
    if (titleEl) titleEl.textContent = slide.name || 'NEW MENU';
    if (quoteEl && slide.subtitle) quoteEl.textContent = slide.subtitle;
    return;
  }

  // Animate: fade out → update → fade in
  const els = [imgEl, titleEl, quoteEl].filter(Boolean);
  gsap.to(els, {
    opacity: 0, y: -12, duration: 0.35, ease: 'power2.in',
    onComplete: () => {
      if (imgEl)   imgEl.src = slide.image_url || './asset/hero3.png';
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

// Isi gambar/judul/quote di kubah hijau langsung tanpa animasi (dipakai fallback).
function updateGreenArchDisplay(item) {
  const imgEl = document.getElementById('es-coklat-cup-img');
  const titleEl = document.getElementById('hero1-title');
  const quoteEl = document.querySelector('.hero-product__quote-text');

  if (imgEl) {
    imgEl.src = (item && item.image_url && item.image_url.trim() !== '') ? item.image_url : './asset/hero3.png';
  }
  if (titleEl) {
    const titleText = (item && item.title && item.title.trim() !== '') ? item.title : 'NEW MENU ES COKLAT';
    titleEl.innerHTML = titleText.replace(/\n/g, '<br>');
    titleEl.style.opacity = '1';
    titleEl.style.visibility = 'visible';
    titleEl.style.display = 'block';
  }
  if (quoteEl && item && item.subtitle && item.subtitle.trim() !== '') {
    quoteEl.textContent = item.subtitle;
  }
}

// Tampilin satu hero banner (carousel lebar bawah marquee) di posisi index.
function renderHeroSlide(index, animate = true) {
  if (!heroSlides || heroSlides.length === 0) return;
  currentSlideIdx = index % heroSlides.length;
  const slide = heroSlides[currentSlideIdx];

  const bannerImgEl = document.getElementById('hero-banner-img');
  const overlayImgEl = document.getElementById('hero-banner-img-overlay');
  const bannerLinkEl = document.getElementById('hero-banner-link');
  const bannerDots = document.querySelectorAll('.fullwidth-banner-dots .banner-dot');

  const defaultBanners = {
    'hero1': './asset/hero1.webp',
    'hero2': './asset/hero2.webp',
    'hero3': './asset/hero1.webp'
  };
  const targetBanner = (slide.image_url && slide.image_url.trim() !== '') ? slide.image_url : (defaultBanners[slide.id] || './asset/hero1.webp');

  const targetUrl = (slide.button_url && slide.button_url.trim() !== '' && slide.button_url !== '#' && slide.button_url !== 'javascript:void(0)') ? slide.button_url : 'drinks.html';
  if (bannerLinkEl) {
    bannerLinkEl.href = targetUrl;
    bannerLinkEl.style.cursor = 'pointer';
  }
  const trackEl = document.querySelector('.fullwidth-banner-track');
  if (trackEl) {
    trackEl.style.cursor = 'pointer';
    trackEl.onclick = (e) => {
      if (!e.target.closest('.fullwidth-banner-dots')) {
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
    let foundDrinkDisplay = null;

    data.forEach(s => {
      if (s.id === 'hero_drink_display') {
        foundDrinkDisplay = s;
        return;
      }

      // Collect active heroes for carousel (hero1, hero2, hero3, and any dynamic hero_... added from admin)
      if (s.id === 'hero1' || s.id === 'hero2' || s.id === 'hero3' || (s.id.startsWith('hero') && s.id !== 'hero_drink_display')) {
        if (s.is_active !== false && s.image_url) {
          heroSlides.push(s);
        }
        return;
      }

      // Handle OTHER SECTIONS (Beverages / Editorial Boxes)
      let boxEl = null;
      switch (s.id) {
        case 'hot_series': boxEl = document.getElementById('hot-series-box'); break;
        case 'green_tea': boxEl = document.getElementById('greentea-box'); break;
        case 'belgian': boxEl = document.getElementById('belgian-box'); break;
        case 'coffee_cream': boxEl = document.getElementById('coffee-cream-box'); break;
      }

      if (boxEl) {
        if (s.is_active === false) {
          boxEl.style.setProperty('display', 'none', 'important');
        } else {
          boxEl.style.display = '';
          if (s.image_url) boxEl.style.backgroundImage = `url('${s.image_url}')`;
          const titleEl = boxEl.querySelector('h3');
          const descEl = boxEl.querySelector('p');
          if (titleEl && s.title) titleEl.textContent = s.title;
          if (descEl && s.subtitle) descEl.textContent = s.subtitle;
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
        if (promoImg && s.image_url) promoImg.src = s.image_url;
        if (promoCard && s.button_url) promoCard.href = s.button_url;
        if (promoCard && s.is_active === false) promoCard.style.display = 'none';
      }
    });

    // Green arch display is controlled by loadDrinkSlides() slideshow

    // Sort heroes by id (hero1, hero2, hero3, hero_...)
    heroSlides.sort((a, b) => a.id.localeCompare(b.id));

    // Fallback default cuma kalau DB belum ada data site_content sama sekali.
    // Kalau baris hero1/2/3 ADA tapi is_active:false (dihapus admin), biarin kosong -
    // jangan balikin default, itu bikin "hapus" keliatan gak ngefek.
    if (heroSlides.length === 0 && !data.some(s => s.id === 'hero1' || s.id === 'hero2' || s.id === 'hero3')) {
      heroSlides = [
        { id: 'hero1', image_url: './asset/hero1.webp', button_url: 'drinks' },
        { id: 'hero2', image_url: './asset/hero2.webp', button_url: 'drinks' },
        { id: 'hero3', image_url: './asset/hero1.webp', button_url: 'drinks' }
      ];
    }

    initHeroCarousel();
    renderHeroSlide(0, false);

    // Refresh ScrollTrigger after content is loaded
    if (typeof ScrollTrigger !== 'undefined') {
      setTimeout(() => ScrollTrigger.refresh(), 300);
    }
  } catch (err) {
    console.warn('Konten tidak dapat dimuat dari database Supabase:', err.message);
    if (heroSlides.length === 0) {
      heroSlides = [
        { id: 'hero1', title: 'NEW MENU ES COKLAT', image_url: './asset/hero3.png' },
        { id: 'hero2', title: 'NEW MENU GREEN TEA', image_url: './asset/hero3.png' },
        { id: 'hero3', title: 'NEW MENU COFFEE CREAM', image_url: './asset/hero3.png' }
      ];
      renderHeroSlide(0, false);
      initHeroCarousel();
    }
  }
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

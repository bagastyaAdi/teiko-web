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

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Sync Lenis with GSAP ScrollTrigger
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0, 0);
  }
}

// 2. GSAP Animations for Hero & Editorial Grid
function initGsapAnimations() {
  if (typeof gsap === 'undefined') return;

  // Hero Content Entrance Animation
  const heroContent = document.querySelector('.gsap-hero-content');
  if (heroContent) {
    gsap.fromTo(
      heroContent.children,
      { opacity: 0, y: 32 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        stagger: 0.18,
        ease: 'power3.out',
        delay: 0.15
      }
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

// 3. Supabase Content Loader
async function loadContent() {
  try {
    if (typeof sb === 'undefined') return;
    const { data, error } = await sb.from('site_content').select('*');
    if (error) throw error;

    const dynamicContainer = document.getElementById('dynamic-heroes-container');
    if (dynamicContainer) dynamicContainer.innerHTML = '';

    data.forEach(s => {
      // 1. Handle HERO NON-DYNAMICS (hero1)
      if (s.id === 'hero1') {
        const sectionEl = document.getElementById('hero1-section');
        if (sectionEl) {
          if (s.is_active === false) {
            sectionEl.style.setProperty('display', 'none', 'important');
          } else {
            sectionEl.style.display = '';
            if (s.image_url) {
              const imgEl = document.getElementById('hero1-img');
              if (imgEl) imgEl.src = s.image_url;
            }
            const titleEl = document.getElementById('hero1-title');
            const subtitleEl = document.getElementById('hero1-subtitle');
            const btnEl = document.getElementById('hero1-btn');

            if (titleEl) titleEl.innerHTML = s.title ? s.title.replace(/\n/g, '<br>') : '';
            if (subtitleEl) subtitleEl.innerHTML = s.subtitle ? s.subtitle.replace(/\n/g, '<br>') : '';
            if (btnEl) {
              btnEl.innerHTML = `${s.button_text || 'Lihat Menu'} <i class="bi bi-arrow-right"></i>`;
              btnEl.href = s.button_url || 'drinks';
            }
            if (s.text_align) {
              const cont = sectionEl.querySelector('.hero-content-right');
              if (cont) {
                cont.className = cont.className.replace(/\btext-(left|center|right|start|end)\b/g, '').trim() + ' ' + s.text_align;
              }
            }
          }
        }
        return;
      // 2. Ignore extra dynamic heroes (hero2, hero3, etc.) so unwanted banners like Matcha Oat Latte do not appear on reload
      if (s.id.startsWith('hero') && s.id !== 'hero1') {
        return;
      }

      // 3. Handle OTHER SECTIONS (Beverages / Editorial Boxes)
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
      }
    });

    // Refresh ScrollTrigger after content is loaded
    if (typeof ScrollTrigger !== 'undefined') {
      setTimeout(() => ScrollTrigger.refresh(), 300);
    }
  } catch (err) {
    console.warn('Konten tidak dapat dimuat dari database Supabase:', err.message);
  }
}

// 4. Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  initGsapAnimations();
  loadContent();
});

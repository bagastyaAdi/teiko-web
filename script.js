// ===== SUPABASE CONTENT LOADER =====
async function loadContent() {
  try {
    const { data, error } = await sb.from('site_content').select('*');
    if (error) throw error;

    const dynamicContainer = document.getElementById('dynamic-heroes-container');
    if (dynamicContainer) dynamicContainer.innerHTML = ''; // Clear previous if any

    data.forEach(s => {
      // 1. Handle HERO NON-DYNAMICS (Special/Static IDs like hero1)
      if (s.id === 'hero1') {
        const sectionEl = document.getElementById('hero1-section');
        if (sectionEl) {
          if (s.is_active === false) {
            sectionEl.style.setProperty('display', 'none', 'important');
          } else {
            sectionEl.style.display = '';
            if (s.image_url) document.getElementById('hero1-img').src = s.image_url;
            document.getElementById('hero1-title').innerHTML = s.title ? s.title.replace(/\n/g, '<br>') : '';
            document.getElementById('hero1-subtitle').innerHTML = s.subtitle ? s.subtitle.replace(/\n/g, '<br>') : '';
            document.getElementById('hero1-btn').textContent = s.button_text || '';
            document.getElementById('hero1-btn').href = s.button_url || '#';
            if (s.text_align) {
              const cont = sectionEl.querySelector('.container');
              if (cont) {
                // Hapus class text-left/center/right lama jika ada, lalu tambahkan yang baru
                cont.className = cont.className.replace(/\btext-(left|center|right)\b/g, '').trim() + ' ' + s.text_align;
              }
            }
          }
        }
        return;
      }

      // 2. Handle DYNAMIC HEROES (hero2, hero3, hero_xxx)
      if (s.id.startsWith('hero')) {
        if (s.is_active === false) return; // Skip if inactive

        const heroHtml = `
          <section id="${s.id}-section" class="hero hero-animated d-flex">
            <img id="${s.id}-img" src="${s.image_url || './asset/hero1.webp'}" alt="Background ${s.id}" class="hero-bg" loading="lazy" />
            <div class="container2 text-dark ${s.text_align || 'text-left'}">
              <h1 id="${s.id}-title" class="fw-bold">${(s.title || '').replace(/\n/g, '<br>')}</h1>
              <p id="${s.id}-subtitle" class="mt-2">${s.subtitle || ''}</p>
              ${s.subtitle2 ? `<p id="${s.id}-subtitle2" class="mt-2">${s.subtitle2}</p>` : ''}
              ${s.button_text ? `<div class="mt-4"><a href="${s.button_url || '#'}" class="btn btn-dark me-3">${s.button_text}</a></div>` : ''}
            </div>
          </section>`;
        if (dynamicContainer) {
          dynamicContainer.insertAdjacentHTML('beforeend', heroHtml);
          const newSection = document.getElementById(`${s.id}-section`);
          if (newSection) observer.observe(newSection);
        }
        return;
      }

      // 3. Handle OTHER SECTIONS (Beverages/Hot Series etc)
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
          if (titleEl) titleEl.textContent = s.title || '';
          if (descEl) descEl.textContent = s.subtitle || '';
        }
      }
    });
  } catch (err) {
    console.warn('Konten tidak dapat dimuat dari database:', err.message);
  }
}

// ===== INTERSECTION OBSERVER (animasi scroll) =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Animasi hanya ditambahkan jika elemen belum visible
      if (!entry.target.classList.contains('is-visible')) {
        entry.target.classList.add('is-visible');
      }
    }
  });
}, {
  threshold: 0.08,
  rootMargin: '0px 0px -40px 0px' // Tunggu sampai 40px masuk viewport sebelum trigger
});

document.addEventListener('DOMContentLoaded', () => {
  // Load konten dari Supabase
  loadContent();

  // Delay singkat agar browser sempat render opacity:0 dulu sebelum observer aktif
  setTimeout(() => {
    document.querySelectorAll('.hero-animated, .minuman-animated').forEach(el => {
      observer.observe(el);
    });
  }, 100);
});

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
          }
        }
        return;
      }

      // 2. Handle DYNAMIC HEROES (hero2, hero3, hero_xxx)
      if (s.id.startsWith('hero')) {
        if (s.is_active === false) return; // Skip if inactive

        const heroHtml = `
          <section id="${s.id}-section" class="hero hero-animated d-flex text-left">
            <img id="${s.id}-img" src="${s.image_url || './asset/hero1.webp'}" alt="Background ${s.id}" class="hero-bg" loading="lazy" />
            <div class="container2 text-dark">
              <h1 id="${s.id}-title" class="fw-bold">${(s.title || '').replace(/\n/g, '<br>')}</h1>
              <p id="${s.id}-subtitle" class="mt-2">${s.subtitle || ''}</p>
              ${s.subtitle2 ? `<p id="${s.id}-subtitle2" class="mt-2">${s.subtitle2}</p>` : ''}
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
    if (entry.isIntersecting) entry.target.classList.add('is-visible');
  });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
  // Load konten dari Supabase
  loadContent();

  // Observe semua elemen animasi
  document.querySelectorAll('.hero-animated, .minuman-animated').forEach(el => {
    observer.observe(el);
  });
});

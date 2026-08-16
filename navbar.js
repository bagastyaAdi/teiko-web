// ===== DRAWER LOGIC =====
// Pasang event buka/tutup drawer navigasi mobile (hamburger, overlay, tombol close, link).
function initDrawer() {
  const hamburger = document.getElementById('hamburger-btn');
  const drawer    = document.getElementById('nav-drawer');
  const overlay   = document.getElementById('drawer-overlay');
  const closeBtn  = document.getElementById('drawer-close-btn');

  if (!hamburger || !drawer || !overlay) return;

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    hamburger.classList.add('open');
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  // Tutup drawer saat link diklik
  drawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

// ===== NAVBAR SPACER =====
// Samain tinggi elemen spacer sama tinggi navbar (navbar fixed, jadi konten
// di bawahnya butuh spacer biar gak ketiban).
function updateNavbarSpacer() {
  const navbar = document.querySelector('#navbar-placeholder nav');
  const spacer = document.getElementById('navbar-spacer');
  if (navbar && spacer) {
    spacer.style.height = navbar.offsetHeight + 'px';
  }
}

window.addEventListener('load', updateNavbarSpacer);
window.addEventListener('resize', updateNavbarSpacer);

// ===== HIGHLIGHT ACTIVE NAV =====
// Kasih class 'active' ke link navbar yang cocok sama halaman yang lagi dibuka.
function highlightActiveNav() {
  const currentPath = window.location.pathname.replace(/^\/|\.html$/g, '').toLowerCase() || 'index';
  document.querySelectorAll('.nav-desktop-link, .drawer-nav-links a').forEach(link => {
    link.classList.remove('active');
    const href = (link.getAttribute('href') || '').replace(/^\/|\.html$/g, '').toLowerCase();
    if (href && href === currentPath) {
      link.classList.add('active');
    }
  });
}

// ===== LOAD NAVBAR =====
// Pasang navbar.html ke placeholder. Kalau ada versi ke-cache di localStorage,
// tampilin itu dulu (instan, gak nunggu network) lalu tetep fetch ulang buat
// refresh cache-nya di background.
const navbarPlaceholder = document.getElementById('navbar-placeholder');

if (localStorage.getItem('navbarHTML')) {
  navbarPlaceholder.innerHTML = localStorage.getItem('navbarHTML');
  initDrawer();
  highlightActiveNav();
}

fetch('/navbar.html')
  .then(res => res.text())
  .then(data => {
    navbarPlaceholder.innerHTML = data;
    localStorage.setItem('navbarHTML', data);
    initDrawer();
    updateNavbarSpacer();
    highlightActiveNav();
  })
  .catch(err => console.error('Gagal memuat navbar:', err));

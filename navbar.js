// ===== DRAWER LOGIC =====
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
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    hamburger.classList.remove('open');
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
function updateNavbarSpacer() {
  const navbar = document.querySelector('#navbar-placeholder nav');
  const spacer = document.getElementById('navbar-spacer');
  if (navbar && spacer) {
    spacer.style.height = navbar.offsetHeight + 'px';
  }
}

window.addEventListener('load', updateNavbarSpacer);
window.addEventListener('resize', updateNavbarSpacer);

// ===== LOAD NAVBAR =====
const navbarPlaceholder = document.getElementById('navbar-placeholder');

if (localStorage.getItem('navbarHTML')) {
  navbarPlaceholder.innerHTML = localStorage.getItem('navbarHTML');
  initDrawer();
}

fetch('/navbar.html')
  .then(res => res.text())
  .then(data => {
    navbarPlaceholder.innerHTML = data;
    localStorage.setItem('navbarHTML', data);
    initDrawer();
    updateNavbarSpacer();
  })
  .catch(err => console.error('Gagal memuat navbar:', err));

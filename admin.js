// ============================================
// TEIKO ADMIN PANEL - admin.js
// ============================================

// DIAGNOSTIC: Global Error Catcher
window.onerror = function(msg, url, line, col, error) {
  // Silent critical errors that common in browsers (like extensions)
  if (msg.includes('ResizeObserver') || msg.includes('Extension')) return false;
  alert(`JS ERROR: ${msg}\nAt: ${line}:${col}\nSaran: Bersihkan cache browser (Ctrl+F5).`);
  return false;
};

// GLOBAL FUNCTION REGISTRY (Hoisting to window)
// This ensures functions are available even if the script has errors later
window.showAddEventForm = () => { console.log('Init phase: showAddEventForm not yet fully loaded'); };
window.showAddFaqForm   = () => { console.log('Init phase: showAddFaqForm not yet fully loaded'); };
window.showAddNewsForm  = () => { console.log('Init phase: showAddNewsForm not yet fully loaded'); };
window.saveNewEventBanner = () => {};
window.saveNewFaq = () => {};
window.saveNewNews = () => {};
window.loadEventsAdmin = () => {};
window.loadFaqAdmin = () => {};
window.loadNewsAdmin = () => {};

console.log('DEBUG: admin.js initialization started');


// Daftar slot konten statis di homepage (posisi tetap, gak bisa dihapus,
// cuma bisa dikosongin). Dipakai renderSections() buat gambar kartu edit di
// "Kelola Konten", dan deleteSection() buat bedain slot statis vs hero dinamis.
const SECTIONS = [
  {
    id: 'hero_drink_display',
    label: 'Display Minuman Kubah Hijau (Atas)',
    defaultImg: './asset/hero3.png',
    fields: [
      { key: 'title',       label: 'Judul Menu Atas',            type: 'textarea', placeholder: 'NEW MENU ES COKLAT' },
      { key: 'subtitle',    label: 'Teks Kutipan (Quote)',       type: 'textarea', placeholder: 'Rasanya Enak Banget, Bikin Nagih! Teiko Emang Paling Pas Buat Setiap Momen.' },
    ]
  },
  {
    id: 'hero1',
    label: 'Banner Promo Lebar 1 (Bawah Hero)',
    defaultImg: './asset/hero1.webp',
    optional: true, // gak dipaksa nongol kalau belum ada foto; hapus = beneran hilang dari grid
    fields: [
      { key: 'button_url',  label: 'Link Tujuan Klik',           type: 'text',     placeholder: 'drinks' },
    ]
  },
  {
    id: 'hero2',
    label: 'Banner Promo Lebar 2 (Bawah Hero)',
    defaultImg: './asset/hero2.webp',
    optional: true,
    fields: [
      { key: 'button_url',  label: 'Link Tujuan Klik',           type: 'text',     placeholder: 'drinks' },
    ]
  },
  {
    id: 'hero3',
    label: 'Banner Promo Lebar 3 (Bawah Hero)',
    defaultImg: './asset/hero1.webp',
    optional: true,
    fields: [
      { key: 'button_url',  label: 'Link Tujuan Klik',           type: 'text',     placeholder: 'drinks' },
    ]
  },
  {
    id: 'hot_series',
    label: 'HOT SERIES',
    defaultImg: './asset/3.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'HOT SERIES' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rangkaian minuman hangat Teiko...' },
    ]
  },
  {
    id: 'green_tea',
    label: 'GREEN TEA',
    defaultImg: './asset/4.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'GREEN TEA' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rasakan kesegaran teh hijau asli Jepang.' },
    ]
  },
  {
    id: 'belgian',
    label: 'BELGIAN',
    defaultImg: './asset/5.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'BELGIAN' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rasakan kesegaran Belgian Choco...' },
    ]
  },
  {
    id: 'coffee_cream',
    label: 'COFFEE CREAM',
    defaultImg: './asset/6.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'COFFEE CREAM' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rasa kopi lembut berpadu krim spesial Teiko.' },
    ]
  },
  // ===== KONTROL SECTION PROMO BAWAH =====
  {
    id: 'promo_section',
    label: 'Tampilkan/Sembunyikan Seluruh Kotak Foto Promo',
    defaultImg: './asset/dummy_choco.png',
    fields: [] // Hanya toggle aktif/nonaktif
  },
  // ===== 4 KOTAK FOTO PROMO BAWAH =====
  {
    id: 'promo_box_1',
    label: 'Kotak Foto Promo 1 (Kiri Atas)',
    defaultImg: './asset/dummy_choco.png',
    fields: [{ key: 'button_url', label: 'Link Tujuan Klik', type: 'text', placeholder: 'drinks' }]
  },
  {
    id: 'promo_box_2',
    label: 'Kotak Foto Promo 2 (Kanan Atas)',
    defaultImg: './asset/dummy_matcha.png',
    fields: [{ key: 'button_url', label: 'Link Tujuan Klik', type: 'text', placeholder: 'drinks' }]
  },
  {
    id: 'promo_box_3',
    label: 'Kotak Foto Promo 3 (Kiri Bawah)',
    defaultImg: './asset/dummy_coffee.png',
    fields: [{ key: 'button_url', label: 'Link Tujuan Klik', type: 'text', placeholder: 'drinks' }]
  },
  {
    id: 'promo_box_4',
    label: 'Kotak Foto Promo 4 (Kanan Bawah)',
    defaultImg: './asset/dummy_taro.png',
    fields: [{ key: 'button_url', label: 'Link Tujuan Klik', type: 'text', placeholder: 'drinks' }]
  }
];

let contentData = {};
let pendingUploads = {};
let drinksData = [];
let eventsAdminData = [];
let faqAdminData = [];
let newsAdminData = [];

// ===== AUTH =====
// Cek session Supabase Auth yang lagi aktif, tampilin dashboard atau login screen.
async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard(session.user);
  } else {
    showLogin();
  }
}

// Tampilin layar login, sembunyiin dashboard.
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

// Tampilin dashboard, sembunyiin layar login, terus load semua data admin.
function showDashboard(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  if (user) {
    document.getElementById('admin-email-display').textContent = user.email;
  }
  
  // Master Initial Load: Load everything once
  fetchAllData();
}

// Load semua data admin sekaligus pas dashboard pertama kali dibuka.
async function fetchAllData() {
  showToast('Menyelaraskan data...', 'info');
  await Promise.all([
    loadContent(true), // Content, Events, FAQ from site_content
    loadDrinks(true)   // Drinks from drinks table
  ]);
  showToast('Data disinkronkan', 'success');
}

// Handle submit form login (email + password lewat Supabase Auth).
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('login-btn');

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Masuk...';

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    showToast('Login gagal: ' + error.message, 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i>Masuk';
  } else {
    showDashboard(data.user);
  }
});

// Handle klik tombol keluar.
document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  showLogin();
  showToast('Berhasil keluar.', 'success');
});

// ===== CONTENT =====
// Ambil semua baris site_content, pisahin jadi sections (hero/promo), events
// (id "event_*"), FAQ (id "faq_*"), dan News (id "news_*"), lalu render semua.
async function loadContent(isInitial = false) {
  const container = document.getElementById('sections-grid');
  if (!isInitial) {
    container.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Memuat konten...</p></div>`;
  }

  try {
    const { data, error } = await sb.from('site_content').select('*').order('id', { ascending: true });
    if (error) throw error;

    contentData = {};
    eventsAdminData = [];
    faqAdminData = [];
    newsAdminData = [];

    data.forEach(row => {
      if (row.id.startsWith('event_')) {
        eventsAdminData.push(row);
      } else if (row.id.startsWith('faq_')) {
        faqAdminData.push(row);
      } else if (row.id.startsWith('news_')) {
        newsAdminData.push(row);
      } else {
        // Hero / Other site content
        contentData[row.id] = row;
      }
    });

    // Sort events & news by ID desc (terbaru dulu)
    eventsAdminData.sort((a, b) => b.id.localeCompare(a.id));
    newsAdminData.sort((a, b) => b.id.localeCompare(a.id));

    // Update Stats
    const syncedEl = document.getElementById('stat-synced');
    if (syncedEl) syncedEl.textContent = Object.keys(contentData).length + eventsAdminData.length + faqAdminData.length + newsAdminData.length;

    renderSections();
    renderEventsAdmin();
    renderFaqAdmin();
    renderNewsAdmin();
  } catch (err) {
    showToast('Gagal memuat: ' + err.message, 'error');
  }
}

// Gabungin slot statis (SECTIONS) + hero dinamis dari DB, render semua jadi
// kartu di grid "Kelola Konten".
function renderSections() {
  const grid = document.getElementById('sections-grid');
  if (!grid) return;
  
  const allSections = [];

  // 1. Static Sections (slot tetap di homepage). Yang "optional" (banner hero1/2/3)
  // cuma ditampilin kalau udah pernah diisi foto - gak dipaksa jadi template kosong.
  SECTIONS.forEach(s => {
    if (s.optional && !contentData[s.id]) return;
    allSections.push(s);
  });

  // 2. Dynamic Heroes from DB
  Object.values(contentData).forEach(row => {
    if (row.id.startsWith('hero') && !SECTIONS.find(s => s.id === row.id)) {
      allSections.push({
        id: row.id,
        label: `Dynamic Hero`,
        defaultImg: './asset/hero1.webp',
        fields: [
          { key: 'title',       label: 'Judul',           type: 'textarea' },
          { key: 'subtitle',    label: 'Paragraf 1',      type: 'textarea' },
          { key: 'subtitle2',   label: 'Paragraf 2',      type: 'textarea' },
          { key: 'button_text', label: 'Teks Tombol',     type: 'text' },
          { key: 'button_url',  label: 'Link Tombol',     type: 'text' },
        ]
      });
    }
  });

  grid.innerHTML = allSections.map(s => createSectionCard(s)).join('');
}

// Bikin HTML satu kartu section (thumbnail, badge aktif, tombol edit/toggle/hapus).
function createSectionCard(section) {
  const data = contentData[section.id] || {};
  const isDeleted = data.image_url === '';
  const imgSrc = data.image_url || section.defaultImg;
  const isActive = data.is_active !== false;

  const isDrinkDisplay = section.id === 'hero_drink_display';

  // Semua card thumbnail kotak (1/1), konsisten kayak mockup - gak ada lagi rasio beda-beda per tipe.
  const aspectRatio = '1/1';

  return `
    <div class="drink-admin-card section-card-v2" id="card-${section.id}">
      <div class="section-card-v2-imgwrap" onclick="editContent('${section.id}')" title="Klik untuk edit">
        ${isDeleted ? `
        <div class="drink-admin-img d-flex flex-column align-items-center justify-content-center text-muted"
          style="aspect-ratio:${aspectRatio};width:100%;background:#eee;border-radius:12px;">
          <i class="bi bi-image" style="font-size:2rem;"></i>
          <small>Belum ada foto</small>
        </div>` : `
        <img src="${imgSrc}" class="drink-admin-img" alt="Preview"
          style="object-fit:cover;aspect-ratio:${aspectRatio};width:100%;display:block;border-radius:12px;">`}
      </div>
      <div class="drink-admin-body">
        <div class="section-card-v2-name">${section.label}</div>
        <div class="section-card-v2-row">
          <span class="section-card-v2-badge ${isActive ? 'is-active' : 'is-off'}" id="badge-${section.id}">${isActive ? 'Aktif' : 'Off'}</span>
          <button class="btn-icon" onclick="editContent('${section.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon" id="toggle-btn-${section.id}" onclick="toggleSection('${section.id}')" title="${isActive ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${isActive ? 'bi-toggle-on' : 'bi-toggle-off'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteSection('${section.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
        ${isDrinkDisplay ? `
        <button class="btn btn-primary w-100 fw-bold mt-3" onclick="document.getElementById('nav-slides').click();" style="font-size: 0.82rem; padding: 7px 10px; border-radius: 6px;">
          <i class="bi bi-images me-1"></i> Kelola / Tambah Slide Minuman
        </button>` : ''}
      </div>
    </div>`;
}

// Helper: Create element from HTML string correctly
function createDiv(htmlString) {
  const div = document.createElement('div');
  div.innerHTML = htmlString.trim();
  return div.firstElementChild || div.firstChild;
}

// ===== IMAGE OPTIMIZATION (WebP & Resize) =====
async function optimizeImage(file, maxWidth = 1280) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if width > maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP blob
        canvas.toBlob((blob) => {
          // Return as a new File object
          const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
            type: 'image/webp',
            lastModified: Date.now()
          });
          resolve(newFile);
        }, 'image/webp', 0.82); // 0.82 quality for good balance
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Helper: Kompres ke WebP & Upload ke Supabase Storage
async function uploadAndOptimizeImage(file, prefix, maxWidth = 1280) {
  const optimizedFile = await optimizeImage(file, maxWidth);
  const filename = `${prefix}_${Date.now()}.webp`;
  const { error: uploadError } = await sb.storage
    .from('site-images')
    .upload(filename, optimizedFile, { upsert: true, contentType: 'image/webp' });
  if (uploadError) throw new Error('Upload gagal: ' + uploadError.message);
  const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
  return urlData.publicUrl + '?t=' + Date.now();
}

// Edit Content Form Logic (Hero Sections)
window.editContent = (id) => {
  const section = SECTIONS.find(s => s.id === id) || {
    id: id,
    label: 'Dynamic Hero',
    fields: [
       { key: 'title',       label: 'Judul',           type: 'textarea' },
       { key: 'subtitle',    label: 'Paragraf 1',      type: 'textarea' },
       { key: 'subtitle2',   label: 'Paragraf 2',      type: 'textarea' },
       { key: 'button_text', label: 'Teks Tombol',     type: 'text' },
       { key: 'button_url',  label: 'Link Tombol',     type: 'text' },
    ]
  };
  const data = contentData[id] || {};

  const existingForm = document.getElementById('edit-content-form-area');
  if (existingForm) existingForm.remove();

  const fieldsHtml = section.fields.map(field => {
    const value = (data[field.key] || '').replace(/</g, '&lt;');
    if (field.type === 'textarea') {
      return `
        <div class="col-12">
          <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">${field.label}</label>
          <textarea id="edit-field-${id}-${field.key}" class="form-input" rows="2">${value}</textarea>
        </div>`;
    }
    return `
      <div class="col-md-6">
        <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">${field.label}</label>
        <input type="text" id="edit-field-${id}-${field.key}" class="form-input" value="${value}">
      </div>`;
  }).join('');

  const formHtml = `
    <div id="edit-content-form-area" class="drink-form-container fade-up mb-4" style="border: 2px solid var(--accent);">
      <h4 class="mb-3">Edit Konten: <span class="text-dark fw-bold">${section.label}</span></h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="edit-content-upload-area">
            <img id="edit-content-preview" src="${data.image_url || section.defaultImg}" class="img-preview" style="display:block">
            <div class="upload-overlay">
              <i class="bi bi-camera"></i><span>Ganti Foto</span>
            </div>
          </div>
          <input type="file" id="edit-content-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            ${fieldsHtml}
            <div class="col-12 text-end mt-3">
               <button class="btn btn-light me-2" onclick="document.getElementById('edit-content-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-content-btn" onclick="saveEditContent('${id}')">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('content-view').insertBefore(createDiv(formHtml), document.getElementById('sections-grid'));

  const upload = document.getElementById('edit-content-upload-area');
  const input = document.getElementById('edit-content-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Sedang memproses gambar...', 'info');
      const optimizedFile = await optimizeImage(file);
      pendingUploads[id] = optimizedFile;

      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('edit-content-preview').src = re.target.result;
      };
      reader.readAsDataURL(optimizedFile);
    }
  };

  document.getElementById('edit-content-form-area').scrollIntoView({ behavior: 'smooth' });
};

// Simpan hasil edit form section (upload foto baru kalau ada, lalu upsert field-fieldnya).
window.saveEditContent = async (id) => {
  const btn = document.getElementById('submit-content-btn');
  const section = SECTIONS.find(s => s.id === id) || { fields: [] };
  
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    let imageUrl = contentData[id]?.image_url || null;

    if (pendingUploads[id]) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads[id], id, 1400);
      delete pendingUploads[id];
    }

    const updateData = { id: id, image_url: imageUrl, updated_at: new Date().toISOString() };
    const fieldKeys = ['title', 'subtitle', 'subtitle2', 'button_text', 'button_url'];

    fieldKeys.forEach(f => {
      const el = document.getElementById(`edit-field-${id}-${f}`);
      if (el) updateData[f] = el.value || null;
    });

    const { error } = await sb.from('site_content').upsert(updateData);
    if (error) throw error;

    contentData[id] = { ...contentData[id], ...updateData };
    showToast('Konten berhasil diperbarui!');
    document.getElementById('edit-content-form-area').remove();
    delete pendingUploads[id];
    loadContent();
  } catch (err) {
    showToast('Gagal update: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Simpan Perubahan'; }
  }
};

// ===== TOGGLE SECTION =====
async function toggleSection(sectionId) {
  const currentData = contentData[sectionId] || { id: sectionId };
  const newActiveState = currentData.is_active === false ? true : false;
  
  // Update UI immediately (optimistic)
  const card = document.getElementById(`card-${sectionId}`);
  const badge = document.getElementById(`badge-${sectionId}`);
  const btn = document.getElementById(`toggle-btn-${sectionId}`);
  const icon = btn.querySelector('i');
  
  if (newActiveState) {
    card.classList.remove('inactive');
    badge.textContent = 'Aktif';
    badge.className = 'card-badge card-badge-active';
    icon.className = 'bi bi-toggle-on';
    btn.title = 'Nonaktifkan section';
  } else {
    card.classList.add('inactive');
    badge.textContent = 'Nonaktif';
    badge.className = 'card-badge card-badge-inactive';
    icon.className = 'bi bi-toggle-off';
    btn.title = 'Aktifkan section';
  }

  try {
    const updateData = { id: sectionId, is_active: newActiveState, updated_at: new Date().toISOString() };
    const { data, error } = await sb.from('site_content').upsert(updateData).select();
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) {
      throw new Error('0 baris tersimpan. Periksa kebijakan RLS (Row Level Security) untuk izin UPDATE/INSERT di tabel site_content Supabase Anda.');
    }

    currentData.is_active = newActiveState;
    contentData[sectionId] = currentData;
    showToast(`Section berhasil ${newActiveState ? 'diaktifkan' : 'dinonaktifkan'}!`, 'success');
  } catch (err) {
    showToast('Gagal mengubah status: ' + err.message, 'error');
  }
}

// ===== DELETE SECTION =====
// Slot statis (SECTIONS di atas) punya posisi tetap di homepage & gak bisa
// benar-benar hilang, jadi "hapus" cuma ngosongin isinya. Hero dinamis
// (ditambah lewat "Tambah Hero Baru") bukan slot tetap, jadi dihapus permanen
// dari DB supaya card-nya beneran hilang dari grid.
async function deleteSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  const isStaticSlot = !!section && !section.optional;

  if (isStaticSlot) {
    if (!confirm('Kosongkan section ini? (Slot tetap ada di homepage, foto & teks akan dihapus)')) return;
    try {
      const { data, error } = await sb.from('site_content').upsert({
        id: sectionId,
        is_active: false,
        image_url: '',
        title: '',
        subtitle: '',
        updated_at: new Date().toISOString()
      }).select();
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('0 baris tersimpan. Periksa kebijakan RLS (Row Level Security) untuk izin UPDATE/INSERT di tabel site_content Supabase Anda.');
      }
      showToast('Section berhasil dikosongkan!', 'success');
      loadContent();
    } catch (err) {
      showToast('Gagal menghapus: ' + err.message, 'error');
    }
    return;
  }

  if (!confirm('Hapus banner ini secara permanen?')) return;
  try {
    const { data, error } = await sb.from('site_content').delete().eq('id', sectionId).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel site_content Supabase Anda.');
    }
    showToast('Banner dihapus.', 'success');
    loadContent();
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}
// Global exposure for onclick handlers
window.toggleSection = toggleSection;
window.deleteSection = deleteSection;

// ===== TOAST =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== VIEW TOGGLE =====
const contentNav   = document.getElementById('nav-content');
const slidesNav    = document.getElementById('nav-slides');
const drinksNav    = document.getElementById('nav-drinks');
const eventsNav    = document.getElementById('nav-events');
const newsNav      = document.getElementById('nav-news');
const feedbackNav  = document.getElementById('nav-feedback');
const faqNav       = document.getElementById('nav-faq');
const contentView  = document.getElementById('content-view');
const slidesView   = document.getElementById('slides-view');
const drinksView   = document.getElementById('drinks-view');
const eventsView   = document.getElementById('events-view');
const newsView     = document.getElementById('news-view');
const feedbackView = document.getElementById('feedback-view');
const faqView      = document.getElementById('faq-view');

const allNavs  = [contentNav, slidesNav, drinksNav, eventsNav, newsNav, feedbackNav, faqNav];
const allViews = [contentView, slidesView, drinksView, eventsView, newsView, feedbackView, faqView];

// Pindah tab sidebar: aktifin nav+view yang dipilih, sembunyiin sisanya,
// terus jalanin loaderCallback (fetch data) kalau ada.
function activateView(navId, viewId, loaderCallback) {
  allNavs.forEach(nav  => { if (nav)  nav.classList.remove('active'); });
  const activeNav = document.getElementById(navId);
  if (activeNav) activeNav.classList.add('active');

  allViews.forEach(view => { if (view) view.style.display = 'none'; });
  const activeView = document.getElementById(viewId);
  if (activeView) activeView.style.display = 'block';

  if (loaderCallback) loaderCallback();
}

// Sambungin tiap link sidebar ke tab-nya masing-masing.
if (contentNav)  contentNav.addEventListener('click',  () => activateView('nav-content',  'content-view'));
if (slidesNav)   slidesNav.addEventListener('click',   () => { activateView('nav-slides',  'slides-view');  loadSlidesAdmin(); });
if (drinksNav)   drinksNav.addEventListener('click',   () => { activateView('nav-drinks',  'drinks-view');  loadDrinks(); });
if (eventsNav)   eventsNav.addEventListener('click',   () => { activateView('nav-events',  'events-view');  loadEventsAdmin(); });
if (newsNav)     newsNav.addEventListener('click',     () => { activateView('nav-news',    'news-view');    loadNewsAdmin(); });
if (feedbackNav) feedbackNav.addEventListener('click', () => activateView('nav-feedback', 'feedback-view', loadFeedback));
if (faqNav)      faqNav.addEventListener('click',      () => { activateView('nav-faq',     'faq-view');     loadFaqAdmin(); });

// ===== SLIDE MINUMAN HERO MANAGEMENT =====
let slidesAdminData = [];

// Ambil daftar slide minuman (hero_drink_slides table) buat tab "Slide Display Minuman".
async function loadSlidesAdmin() {
  const grid = document.getElementById('slides-grid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Memuat slide...</p></div>`;
  try {
    const { data, error } = await sb.from('hero_drink_slides').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    slidesAdminData = data;
    renderSlidesAdmin();
  } catch (err) {
    grid.innerHTML = `<div class="loading-state" style="color:#e74c3c;"><p>Gagal memuat: ${err.message}</p></div>`;
  }
}

// Render kartu-kartu slide minuman ke grid.
function renderSlidesAdmin() {
  const grid = document.getElementById('slides-grid');
  if (!grid) return;
  if (slidesAdminData.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Belum ada slide. Klik "+ Tambah Slide Baru".</p></div>`;
    return;
  }
  grid.innerHTML = slidesAdminData.map(slide => {
    const imgSrc = (slide.image_url && slide.image_url.trim()) ? slide.image_url : './asset/hero3.png';
    const subtitle = slide.subtitle ? slide.subtitle.substring(0, 60) + (slide.subtitle.length > 60 ? '…' : '') : '';
    return `
    <div class="drink-admin-card section-card-v2" id="slide-card-${slide.id}">
      <div class="section-card-v2-imgwrap" onclick="editSlide('${slide.id}')" title="Klik untuk edit">
        <img src="${imgSrc}" class="drink-admin-img" alt="Preview" style="object-fit:cover;aspect-ratio:1/1;width:100%;display:block;border-radius:12px;">
      </div>
      <div class="drink-admin-body">
        <div class="section-card-v2-name">${slide.name || '(Tanpa Nama)'}</div>
        ${subtitle ? `<div class="text-muted" style="font-size:0.8rem;margin:-6px 0 12px;">${subtitle}</div>` : ''}
        <div class="section-card-v2-row">
          <span class="section-card-v2-badge ${slide.is_active ? 'is-active' : 'is-off'}">${slide.is_active ? 'Aktif' : 'Off'}</span>
          <button class="btn-icon" onclick="editSlide('${slide.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon" onclick="toggleSlide('${slide.id}', ${!slide.is_active})" title="${slide.is_active ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${slide.is_active ? 'bi-eye-slash' : 'bi-eye'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteSlide('${slide.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const addSlideBtn = document.getElementById('add-slide-btn');
  if (addSlideBtn) addSlideBtn.addEventListener('click', showAddSlideForm);
});

// Toggle form tambah slide baru (tutup kalau udah kebuka).
function showAddSlideForm() {
  const existing = document.getElementById('slide-form-area');
  if (existing) { existing.remove(); return; }
  const formHtml = `
    <div id="slide-form-area" class="drink-form-container fade-up">
      <h4 class="mb-3">Tambah Slide Minuman Baru</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="slide-upload-area">
            <img id="slide-preview" src="./asset/hero3.png" class="img-preview" style="display:none;aspect-ratio:3/4;object-fit:cover;">
            <div class="upload-placeholder" id="slide-placeholder"><i class="bi bi-plus-circle"></i><p>Foto Minuman</p></div>
          </div>
          <input type="file" id="slide-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12"><input type="text" id="slide-name" class="form-input" placeholder="Nama Menu (contoh: NEW MENU GREEN TEA)"></div>
            <div class="col-12"><textarea id="slide-subtitle" class="form-input" placeholder="Tagline / Kutipan" rows="2"></textarea></div>
            <div class="col-md-6"><input type="number" id="slide-order" class="form-input" placeholder="Urutan (0, 1, 2…)" min="0" value="0"></div>
            <div class="col-12 text-end mt-2">
               <button class="btn btn-light me-2" onclick="document.getElementById('slide-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-slide-btn" onclick="saveNewSlide()">Simpan Slide</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  const slidesView = document.getElementById('slides-view');
  const slidesGrid = document.getElementById('slides-grid');
  slidesView.insertBefore(createDiv(formHtml), slidesGrid);
  const upload = document.getElementById('slide-upload-area');
  const input  = document.getElementById('slide-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const opt = await optimizeImage(file, 900);
      pendingUploads['new_slide'] = opt;
      const reader = new FileReader();
      reader.onload = re => {
        const prev = document.getElementById('slide-preview');
        prev.src = re.target.result;
        prev.style.display = 'block';
        document.getElementById('slide-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(opt);
    }
  };
}

window.saveNewSlide = async () => {
  const name     = document.getElementById('slide-name').value.trim();
  const subtitle = document.getElementById('slide-subtitle').value.trim();
  const order    = parseInt(document.getElementById('slide-order').value) || 0;
  const btn      = document.getElementById('submit-slide-btn');
  if (!name) { showToast('Nama slide wajib diisi', 'error'); return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';
  try {
    let imageUrl = null;
    if (pendingUploads['new_slide']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['new_slide'], 'slide', 900);
      delete pendingUploads['new_slide'];
    }
    const { error } = await sb.from('hero_drink_slides').insert({ name, subtitle, image_url: imageUrl, sort_order: order, is_active: true });
    if (error) throw error;
    showToast('Slide berhasil ditambahkan!');
    document.getElementById('slide-form-area').remove();
    loadSlidesAdmin();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Slide'; }
  }
};

// Tampilin form edit buat satu slide minuman (isi field dari data yang ada).
window.editSlide = (id) => {
  const slide = slidesAdminData.find(s => s.id === id);
  if (!slide) return;
  const existing = document.getElementById('edit-slide-form-area');
  if (existing) existing.remove();
  const formHtml = `
    <div id="edit-slide-form-area" class="drink-form-container fade-up mt-4" style="border:2px solid #0d6efd;">
      <h4 class="mb-3">Edit Slide: <span class="text-dark fw-bold">${slide.name}</span></h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="edit-slide-upload-area">
            <img id="edit-slide-preview" src="${slide.image_url || './asset/hero3.png'}" class="img-preview" style="display:block;aspect-ratio:3/4;object-fit:cover;">
            <div class="upload-overlay"><i class="bi bi-camera"></i><span>Ganti Foto</span></div>
          </div>
          <input type="file" id="edit-slide-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12"><input type="text" id="edit-slide-name" class="form-input" value="${slide.name || ''}" placeholder="Nama Menu"></div>
            <div class="col-12"><textarea id="edit-slide-subtitle" class="form-input" placeholder="Tagline / Kutipan" rows="2">${slide.subtitle || ''}</textarea></div>
            <div class="col-md-6"><input type="number" id="edit-slide-order" class="form-input" value="${slide.sort_order ?? 0}" placeholder="Urutan" min="0"></div>
            <div class="col-12 text-end mt-3">
               <button class="btn btn-light me-2" onclick="document.getElementById('edit-slide-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-edit-slide-btn" onclick="saveEditSlide('${slide.id}')">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  const slidesView = document.getElementById('slides-view');
  const slidesGrid = document.getElementById('slides-grid');
  slidesView.insertBefore(createDiv(formHtml), slidesGrid);
  const upload = document.getElementById('edit-slide-upload-area');
  const input  = document.getElementById('edit-slide-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const opt = await optimizeImage(file, 900);
      pendingUploads['edit_slide'] = opt;
      const reader = new FileReader();
      reader.onload = re => { document.getElementById('edit-slide-preview').src = re.target.result; };
      reader.readAsDataURL(opt);
    }
  };
  document.getElementById('edit-slide-form-area').scrollIntoView({ behavior: 'smooth' });
};

// Simpan hasil edit slide (nama, subtitle, urutan, foto baru kalau ada).
window.saveEditSlide = async (id) => {
  const name     = document.getElementById('edit-slide-name').value.trim();
  const subtitle = document.getElementById('edit-slide-subtitle').value.trim();
  const order    = parseInt(document.getElementById('edit-slide-order').value) || 0;
  const btn      = document.getElementById('submit-edit-slide-btn');
  if (!name) { showToast('Nama wajib diisi', 'error'); return; }
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';
  try {
    const slide = slidesAdminData.find(s => s.id === id);
    let imageUrl = slide.image_url;
    if (pendingUploads['edit_slide']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['edit_slide'], 'slide', 900);
      delete pendingUploads['edit_slide'];
    }
    const { error } = await sb.from('hero_drink_slides').update({ name, subtitle, image_url: imageUrl, sort_order: order }).eq('id', id);
    if (error) throw error;
    showToast('Slide berhasil diperbarui!');
    document.getElementById('edit-slide-form-area').remove();
    loadSlidesAdmin();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Perubahan'; }
  }
};

// Aktif/nonaktifin satu slide minuman.
window.toggleSlide = async (id, state) => {
  try {
    const { error } = await sb.from('hero_drink_slides').update({ is_active: state }).eq('id', id);
    if (error) throw error;
    showToast('Status slide diperbarui.');
    loadSlidesAdmin();
  } catch (err) { showToast('Gagal: ' + err.message, 'error'); }
};

// Hapus satu slide minuman secara permanen dari DB.
window.deleteSlide = async (id) => {
  if (!confirm('Hapus slide ini secara permanen?')) return;
  try {
    const { data, error } = await sb.from('hero_drink_slides').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel hero_drink_slides Supabase Anda.');
    }
    showToast('Slide dihapus.');
    loadSlidesAdmin();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
};

// ===== FEEDBACK MANAGEMENT =====
async function loadFeedback() {
  const list = document.getElementById('feedback-list');
  list.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Memuat masukan...</p></div>`;

  try {
    const { data, error } = await sb.from('feedback').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    document.getElementById('feedback-count').textContent = `${data.length} masukan`;

    if (data.length === 0) {
      list.innerHTML = `<div class="loading-state" style="opacity:0.5;"><p>Belum ada masukan yang masuk.</p></div>`;
      return;
    }

    list.innerHTML = data.map(fb => {
      const date = new Date(fb.created_at).toLocaleString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
      return `
        <div class="feedback-item-card">
          <div class="feedback-item-header">
            <div class="feedback-user-info">
              <div class="feedback-user-avatar"><i class="bi bi-chat-dots"></i></div>
              <div class="feedback-user-details">
                <div class="feedback-user-email">${fb.email}</div>
                <div class="feedback-user-date">${date}</div>
              </div>
            </div>
            <button class="btn-delete-feedback" onclick="deleteFeedback('${fb.id}', this)" title="Hapus">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
          <p class="feedback-item-message">${fb.message}</p>
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `<div class="loading-state" style="color:#e74c3c;"><p>Gagal memuat: ${err.message}</p></div>`;
  }
}

// Hapus satu masukan pengunjung dari DB.
async function deleteFeedback(id, btn) {
  if (!confirm('Hapus masukan ini?')) return;
  if (btn) btn.disabled = true;
  try {
    const { data, error } = await sb.from('feedback').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel feedback Supabase Anda.');
    }
    loadFeedback();
    showToast('Masukan berhasil dihapus.', 'success');
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
    if (btn) btn.disabled = false;
  }
}
window.deleteFeedback = deleteFeedback;


// ===== DRINKS MANAGEMENT =====

// Ambil semua menu minuman (drinks table) buat tab "Kelola Menu".
async function loadDrinks(isInitial = false) {
  const grid = document.getElementById('drinks-grid');
  if (!grid) return;
  if (!isInitial) {
    grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Memuat daftar minuman...</p></div>`;
  }

  try {
    const { data, error } = await sb.from('drinks').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    drinksData = data;
    renderDrinks();
  } catch (err) {
    showToast('Gagal memuat minuman: ' + err.message, 'error');
  }
}

// Render kartu-kartu menu minuman.
function renderDrinks() {
  const grid = document.getElementById('drinks-grid');
  if (!grid) return;
  if (drinksData.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Belum ada menu minuman. Klik "Tambah Menu Baru".</p></div>`;
    return;
  }

  grid.innerHTML = drinksData.map(drink => {
    const imgSrc = (drink.image_url && drink.image_url.trim() !== '') ? drink.image_url : './asset/hero1.webp';
    return `
    <div class="drink-admin-card" id="drink-card-${drink.id}">
      <div class="drink-admin-img-wrapper" style="position:relative;cursor:pointer;" onclick="editDrink('${drink.id}')" title="Klik untuk edit">
        <img src="${imgSrc}" class="drink-admin-img" alt="${drink.name}" style="width:100%;display:block;">
        <div style="position:absolute;inset:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;border-radius:var(--radius) var(--radius) 0 0;" class="drink-img-hover-overlay">
          <i class="bi bi-pencil" style="color:#fff;font-size:1.5rem;"></i>
        </div>
      </div>
      <div class="drink-admin-body">
        <div class="drink-admin-name">${drink.name}</div>
        <div class="drink-admin-meta">
          <span class="drink-admin-badge">${drink.category || 'No Cat'}</span>
          <span class="drink-admin-badge">${drink.oz_size || '-'}</span>
          <span class="drink-admin-badge">${drink.price || '-'}</span>
          <span class="drink-admin-badge ${drink.is_active ? 'bg-success text-white' : 'bg-danger text-white'}">${drink.is_active ? 'Aktif' : 'Off'}</span>
        </div>
        <div class="drink-admin-actions">
          <button class="btn-icon" onclick="editDrink('${drink.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon ${drink.is_active ? '' : 'text-success'}" onclick="toggleDrinkActive('${drink.id}', ${!drink.is_active})" title="${drink.is_active ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${drink.is_active ? 'bi-eye-slash' : 'bi-eye'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteDrink('${drink.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>`;
  }).join('');

  // Hover effect for image overlay
  document.querySelectorAll('.drink-img-hover-overlay').forEach(overlay => {
    const wrapper = overlay.parentElement;
    wrapper.addEventListener('mouseenter', () => overlay.style.opacity = '1');
    wrapper.addEventListener('mouseleave', () => overlay.style.opacity = '0');
  });
}

// Import 8 menu minuman default Teiko ke tabel drinks (buat DB yang masih kosong).
window.seedDefaultDrinks = async () => {
  const btn = document.getElementById('btn-seed-drinks');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Mengimpor Menu Minuman...';
  }
  showToast('Sedang mengimpor 8 Menu Minuman Teiko ke Supabase...', 'info');

  const defaultDrinks = [
    {
      name: 'Es Coklat Teiko Special',
      category: 'Chocolate',
      price: 'Rp 15.000',
      oz_size: '16 oz',
      image_url: './asset/hero3.png',
      detail: 'Paduan coklat pekat khas Belgia dengan susu segar dan krim manis yang lumer di mulut.',
      is_active: true
    },
    {
      name: 'Brown Sugar Boba Milk',
      category: 'Milk',
      price: 'Rp 18.000',
      oz_size: '16 oz',
      image_url: './asset/hero1.webp',
      detail: 'Susu segar lembut dipadukan dengan gula aren asli khas Teiko serta kenyalnya boba premium.',
      is_active: true
    },
    {
      name: 'Matcha Oat Latte',
      category: 'Tea',
      price: 'Rp 20.000',
      oz_size: '16 oz',
      image_url: './asset/dummy_matcha.png',
      detail: 'Teh hijau Uji Matcha pilihan bergaya Jepang dengan susu oat yang gurih dan menyehatkan.',
      is_active: true
    },
    {
      name: 'Belgian Choco Cream',
      category: 'Chocolate',
      price: 'Rp 18.000',
      oz_size: '16 oz',
      image_url: './asset/dummy_choco.png',
      detail: 'Cokelat Belgia autentik dengan lapisan krim kental bertekstur lembut dan rasa cokelat pekat.',
      is_active: true
    },
    {
      name: 'Teiko Coffee Cream Special',
      category: 'Coffee',
      price: 'Rp 18.000',
      oz_size: '16 oz',
      image_url: './asset/dummy_coffee.png',
      detail: 'Kopi espresso house-blend Teiko berpadu dengan susu kental lembut dan taburan bubuk kopi.',
      is_active: true
    },
    {
      name: 'Taro Creamy Milk',
      category: 'Milk',
      price: 'Rp 16.000',
      oz_size: '16 oz',
      image_url: './asset/dummy_taro.png',
      detail: 'Aroma talas (taro) yang harum manis menyatu sempurna dengan susu krim kental khas Teiko.',
      is_active: true
    },
    {
      name: 'Jasmine Green Tea Original',
      category: 'Tea',
      price: 'Rp 10.000',
      oz_size: '22 oz',
      image_url: './asset/hero1.webp',
      detail: 'Teh melati seduh segar alami yang harum, ringan, dan sangat menyegarkan untuk setiap waktu.',
      is_active: true
    },
    {
      name: 'Caramel Macchiato Teiko',
      category: 'Coffee',
      price: 'Rp 20.000',
      oz_size: '16 oz',
      image_url: './asset/dummy_coffee.png',
      detail: 'Espresso kaya rasa dengan sirup karamel legit dan lapisan busa susu yang lembut.',
      is_active: true
    }
  ];

  try {
    const { error } = await sb.from('drinks').insert(defaultDrinks);
    if (error) throw error;
    showToast('8 Menu Minuman Teiko berhasil diimpor ke Supabase!', 'success');
    await loadDrinks();
  } catch (err) {
    showToast('Gagal mengimpor menu minuman: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-cloud-download me-2"></i>Coba Import Lagi';
    }
  }
};

// Add Drink Form Handling
document.getElementById('add-drink-btn').addEventListener('click', () => {
  const existingForm = document.getElementById('drink-form-area');
  if (existingForm) {
    existingForm.remove();
    return;
  }

  const formHtml = `
    <div id="drink-form-area" class="drink-form-container fade-up">
      <h4 class="mb-3">Tambah Minuman Baru</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="drink-upload-area">
            <img id="drink-preview" src="./asset/hero1.webp" class="img-preview" style="display:none">
            <div class="upload-placeholder" id="drink-placeholder">
              <i class="bi bi-plus-circle"></i><p>Foto Minuman</p>
            </div>
          </div>
          <input type="file" id="drink-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12"><input type="text" id="drink-name" class="form-input" placeholder="Nama Minuman"></div>
            <div class="col-12"><textarea id="drink-detail" class="form-input" placeholder="Detail / Deskripsi Minuman" rows="2"></textarea></div>
            <div class="col-md-4"><input type="text" id="drink-oz" class="form-input" placeholder="Oz / Ukuran (misal: 12 oz)"></div>
            <div class="col-md-4"><input type="text" id="drink-price" class="form-input" placeholder="Harga (misal: 15k)"></div>
            <div class="col-md-4">
              <select id="drink-category" class="form-input">
                <option value="" disabled selected hidden>Pilih Kategori</option>
                <option value="Tea">Tea</option>
                <option value="Chocolate">Chocolate</option>
                <option value="Milk">Milk</option>
                <option value="Coffee">Coffee</option>
              </select>
            </div>
            <div class="col-12 text-end mt-2">
               <button class="btn btn-light me-2" onclick="document.getElementById('drink-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-drink-btn" onclick="saveNewDrink()">Simpan Minuman</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('drinks-view').insertBefore(createDiv(formHtml), document.getElementById('drinks-grid'));

  // Init listeners for new form
  const upload = document.getElementById('drink-upload-area');
  const input = document.getElementById('drink-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Memproses gambar minuman...', 'info');
      const optimizedFile = await optimizeImage(file, 1000); // Drinks can be smaller
      pendingUploads['new_drink'] = optimizedFile;
      
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('drink-preview').src = re.target.result;
        document.getElementById('drink-preview').style.display = 'block';
        document.getElementById('drink-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(optimizedFile);
    }
  };
});

// Simpan menu minuman baru dari form "Tambah Menu Baru" (upload foto, insert ke DB).
async function saveNewDrink() {
  const name = document.getElementById('drink-name').value;
  const detail = document.getElementById('drink-detail').value;
  const oz = document.getElementById('drink-oz').value;
  const price = document.getElementById('drink-price').value;
  const category = document.getElementById('drink-category').value;
  const btn = document.getElementById('submit-drink-btn');

  if (!name) { showToast('Nama minuman wajib diisi', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menambahkan...';

  try {
    let imageUrl = null;
    if (pendingUploads['new_drink']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['new_drink'], 'drink', 900);
      delete pendingUploads['new_drink'];
    }

    const { error } = await sb.from('drinks').insert({
      name, detail, oz_size: oz, price, category, image_url: imageUrl, is_active: true
    });

    if (error) throw error;

    showToast('Minuman berhasil ditambahkan!');
    document.getElementById('drink-form-area').remove();
    delete pendingUploads['new_drink'];
    loadDrinks();
  } catch (err) {
    showToast('Gagal menambah minuman: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Simpan Minuman';
  }
}

// Aktif/nonaktifin satu menu minuman.
async function toggleDrinkActive(id, state) {
  try {
    const { error } = await sb.from('drinks').update({ is_active: state }).eq('id', id);
    if (error) throw error;
    showToast(`Status menu diperbarui.`);
    loadDrinks();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
}

// Hapus satu menu minuman secara permanen dari DB.
async function deleteDrink(id) {
  if (!confirm('Hapus minuman ini secara permanen?')) return;
  try {
    const { data, error } = await sb.from('drinks').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel drinks Supabase Anda.');
    }
    showToast('Minuman dihapus.');
    loadDrinks();
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}

// Global exposure for onclick handlers
window.toggleDrinkActive = toggleDrinkActive;
window.deleteDrink = deleteDrink;
// Tampilin form edit buat satu menu minuman (isi field dari data yang ada).
window.editDrink = (id) => {
  const drink = drinksData.find(d => d.id === id);
  if (!drink) return;

  const existingForm = document.getElementById('edit-drink-form-area');
  if (existingForm) existingForm.remove();

  const formHtml = `
    <div id="edit-drink-form-area" class="drink-form-container fade-up mt-4" style="border: 2px solid var(--primary-color);">
      <h4 class="mb-3">Edit Minuman: <span class="text-dark fw-bold">${drink.name}</span></h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="edit-drink-upload-area">
            <img id="edit-drink-preview" src="${drink.image_url || './asset/hero1.webp'}" class="img-preview" style="display:block">
            <div class="upload-overlay">
              <i class="bi bi-camera"></i><span>Ganti Foto</span>
            </div>
          </div>
          <input type="file" id="edit-drink-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Nama Minuman</label>
              <input type="text" id="edit-drink-name" class="form-input" placeholder="Nama Minuman" value="${drink.name}">
            </div>
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Detail / Deskripsi</label>
              <textarea id="edit-drink-detail" class="form-input" placeholder="Deskripsi Minuman" rows="2">${drink.detail || ''}</textarea>
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Size / Ukuran</label>
              <input type="text" id="edit-drink-oz" class="form-input" placeholder="Oz / Ukuran" value="${drink.oz_size || ''}">
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Harga</label>
              <input type="text" id="edit-drink-price" class="form-input" placeholder="Harga" value="${drink.price || ''}">
            </div>
            <div class="col-md-4">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Kategori</label>
              <select id="edit-drink-category" class="form-input">
                <option value="" disabled ${!drink.category ? 'selected' : ''} hidden>Pilih Kategori</option>
                <option value="Tea" ${drink.category === 'Tea' ? 'selected' : ''}>Tea</option>
                <option value="Chocolate" ${drink.category === 'Chocolate' ? 'selected' : ''}>Chocolate</option>
                <option value="Milk" ${drink.category === 'Milk' ? 'selected' : ''}>Milk</option>
                <option value="Coffee" ${drink.category === 'Coffee' ? 'selected' : ''}>Coffee</option>
              </select>
            </div>
            <div class="col-12 text-end mt-3">
               <button class="btn btn-light me-2" onclick="document.getElementById('edit-drink-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-edit-drink-btn" onclick="saveEditDrink('${drink.id}')">
                 Mulai Update
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('drinks-view').insertBefore(createDiv(formHtml), document.getElementById('drinks-grid'));

  const upload = document.getElementById('edit-drink-upload-area');
  const input = document.getElementById('edit-drink-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Memproses gambar...', 'info');
      const optimizedFile = await optimizeImage(file, 1000);
      pendingUploads['edit_drink'] = optimizedFile;
      
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('edit-drink-preview').src = re.target.result;
      };
      reader.readAsDataURL(optimizedFile);
    }
  };
  
  document.getElementById('edit-drink-form-area').scrollIntoView({ behavior: 'smooth' });
};

// Simpan hasil edit menu minuman (upload foto baru kalau ada, lalu update DB).
window.saveEditDrink = async (id) => {
  const name = document.getElementById('edit-drink-name').value;
  const detail = document.getElementById('edit-drink-detail').value;
  const oz = document.getElementById('edit-drink-oz').value;
  const price = document.getElementById('edit-drink-price').value;
  const category = document.getElementById('edit-drink-category').value;
  const btn = document.getElementById('submit-edit-drink-btn');

  if (!name) { showToast('Nama minuman wajib diisi', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Mengupdate...';

  try {
    const drink = drinksData.find(d => d.id === id);
    let imageUrl = drink.image_url;

    if (pendingUploads['edit_drink']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['edit_drink'], 'drink', 900);
      delete pendingUploads['edit_drink'];
    }

    const { error } = await sb.from('drinks').update({
      name, detail, oz_size: oz, price, category, image_url: imageUrl
    }).eq('id', id);

    if (error) throw error;

    showToast('Minuman berhasil diperbarui!');
    document.getElementById('edit-drink-form-area').remove();
    delete pendingUploads['edit_drink'];
    loadDrinks();
  } catch (err) {
    showToast('Gagal mengubah minuman: ' + err.message, 'error');
  } finally {
    if(btn) {
      btn.disabled = false;
      btn.innerHTML = 'Mulai Update';
    }
  }
};
window.addNewHero = addNewHero;
window.saveNewHero = saveNewHero;
window.saveNewDrink = saveNewDrink;

// Toggle form tambah hero banner dinamis baru (tutup kalau udah kebuka).
async function addNewHero() {
  const existingForm = document.getElementById('new-hero-form-area');
  if (existingForm) { existingForm.remove(); return; }

  const formHtml = `
    <div id="new-hero-form-area" class="drink-form-container fade-up mb-4" style="border: 2px solid var(--accent); background: white;">
      <h4 class="mb-3">Tambah Hero Section Baru</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="new-hero-upload-area">
            <img id="new-hero-preview" src="./asset/hero1.webp" class="img-preview" style="display:none">
            <div class="upload-placeholder" id="new-hero-placeholder">
              <i class="bi bi-plus-circle"></i><p>Pilih Foto Banner</p>
            </div>
          </div>
          <input type="file" id="new-hero-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12"><input type="text" id="new-hero-title" class="form-input" placeholder="Judul Hero (Title)"></div>
            <div class="col-12"><input type="text" id="new-hero-sub1" class="form-input" placeholder="Subtitle 1"></div>
            <div class="col-12"><textarea id="new-hero-sub2" class="form-input" placeholder="Subtitle 2 / Deskripsi" rows="2"></textarea></div>
            <div class="col-md-6"><input type="text" id="new-hero-btn-text" class="form-input" placeholder="Teks Tombol (Lihat Menu)"></div>
            <div class="col-md-6"><input type="text" id="new-hero-btn-url" class="form-input" placeholder="Link Tombol (drinks)"></div>
            <div class="col-12 text-end mt-2">
               <button class="btn btn-light me-2" onclick="document.getElementById('new-hero-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-new-hero-btn" onclick="saveNewHero()">Simpan Hero Baru</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('content-view').insertBefore(createDiv(formHtml), document.getElementById('sections-grid'));

  const upload = document.getElementById('new-hero-upload-area');
  const input = document.getElementById('new-hero-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Memproses gambar...', 'info');
      const optimizedFile = await optimizeImage(file);
      pendingUploads['new_hero'] = optimizedFile;
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('new-hero-preview').src = re.target.result;
        document.getElementById('new-hero-preview').style.display = 'block';
        document.getElementById('new-hero-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(optimizedFile);
    }
  };
}

// Simpan hero banner dinamis baru (id auto-generate "hero_<timestamp>") ke site_content.
async function saveNewHero() {
  const btn = document.getElementById('submit-new-hero-btn');
  const title = document.getElementById('new-hero-title').value;
  if (!pendingUploads['new_hero']) { showToast('Wajib upload foto hero!', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    const imageUrl = await uploadAndOptimizeImage(pendingUploads['new_hero'], 'hero', 1400);
    delete pendingUploads['new_hero'];
    
    const { error } = await sb.from('site_content').insert({
      id: `hero_${Date.now()}`,
      title: title,
      subtitle: document.getElementById('new-hero-sub1').value,
      subtitle2: document.getElementById('new-hero-sub2').value,
      button_text: document.getElementById('new-hero-btn-text').value,
      button_url: document.getElementById('new-hero-btn-url').value,
      image_url: imageUrl,
      is_active: true
    });

    if (error) throw error;
    showToast('Hero baru berhasil ditambahkan!');
    document.getElementById('new-hero-form-area').remove();
    delete pendingUploads['new_hero'];
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Simpan Hero Baru'; }
  }
}

// ===== EVENTS MANAGEMENT (DATA FROM site_content) =====

function loadEventsAdmin() {
  // Data is now pre-loaded by loadContent()
  renderEventsAdmin();
}

// Render kartu-kartu banner event ke grid.
function renderEventsAdmin() {
  const grid = document.getElementById('events-grid');
  if(!grid) return;
  
  if (eventsAdminData.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Belum ada banner event di site_content. Klik "Tambah Event Banner".</p></div>`;
    return;
  }

  grid.innerHTML = eventsAdminData.map(ev => `
    <div class="drink-admin-card" id="event-card-${ev.id}">
      <img src="${ev.image_url || './asset/hero1.webp'}" class="drink-admin-img" alt="Event Banner" style="object-fit: contain; aspect-ratio: 5/4; background: #f0f0f0;">
      <div class="drink-admin-body">
        <div class="drink-admin-name">${ev.title || 'Event Banner'}</div>
        <div class="drink-admin-meta">
          <span class="drink-admin-badge ${ev.is_active !== false ? 'bg-success text-white' : 'bg-danger text-white'}">${ev.is_active !== false ? 'Aktif' : 'Off'}</span>
          <span class="small text-muted d-block mt-1" style="font-size:0.7rem">${ev.subtitle || ''}</span>
        </div>
        <div class="drink-admin-actions mt-3">
          <button class="btn-icon" onclick="editEvent('${ev.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon ${ev.button_text === 'PRIMARY' ? 'text-warning' : ''}" onclick="toggleEventPrimary('${ev.id}', ${ev.button_text !== 'PRIMARY'})" title="${ev.button_text === 'PRIMARY' ? 'Jadikan Biasa' : 'Jadikan Landscape (Primary)'}">
            <i class="bi ${ev.button_text === 'PRIMARY' ? 'bi-star-fill' : 'bi-star'}"></i>
          </button>
          <button class="btn-icon ${ev.is_active !== false ? '' : 'text-success'}" onclick="toggleEventActive('${ev.id}', ${ev.is_active === false})" title="${ev.is_active !== false ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${ev.is_active !== false ? 'bi-eye-slash' : 'bi-eye'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteEvent('${ev.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

// Aktif/nonaktifin satu banner event.
async function toggleEventActive(id, state) {
  try {
    const { error } = await sb.from('site_content').update({ is_active: state }).eq('id', id);
    if (error) throw error;
    showToast('Status event diperbarui');
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
}

// Jadiin satu event "PRIMARY" (tampil landscape besar) atau balikin jadi reguler.
async function toggleEventPrimary(id, isPrimary) {
  try {
    const { error } = await sb.from('site_content').update({ 
      button_text: isPrimary ? 'PRIMARY' : null 
    }).eq('id', id);
    
    if (error) throw error;
    showToast(isPrimary ? 'Event diset sebagai Primary (Landscape)' : 'Event diset sebagai Reguler');
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
}


// Hapus satu banner event secara permanen dari DB.
async function deleteEvent(id) {
  if (!confirm('Hapus banner event ini dari site_content?')) return;
  try {
    const { data, error } = await sb.from('site_content').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel site_content Supabase Anda.');
    }
    showToast('Banner event dihapus.');
    loadContent();
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}


// Tambah Event Banner UI & Logic
window.showAddEventForm = () => {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  const existingForm = document.getElementById('event-form-area');
  if (existingForm) { existingForm.remove(); return; }

  const formHtml = `
    <div id="event-form-area" class="drink-form-container fade-up mb-4" style="border: 2px solid var(--accent); background: white;">
      <h4 class="mb-3">Tambah Event Banner</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="event-upload-area">
            <img id="event-preview" src="./asset/hero1.webp" class="img-preview" style="display:none; object-fit: contain; aspect-ratio: 5/4; background: #f0f0f0;">
            <div class="upload-placeholder" id="event-placeholder">
              <i class="bi bi-plus-circle"></i><p>Pilih Foto (1350x1080)</p>
            </div>
          </div>
          <input type="file" id="event-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12"><input type="text" id="event-title" class="form-input" placeholder="Nama Event (misal: Beli 1 Gratis 1)"></div>
            <div class="col-12"><input type="text" id="event-date" class="form-input" placeholder="Tanggal/Periode (subtitle)"></div>
            <div class="col-12"><textarea id="event-benefit" class="form-input" placeholder="Keuntungan / Deskripsi (subtitle2)" rows="2"></textarea></div>
            <div class="col-12"><textarea id="event-tnc" class="form-input" placeholder="Syarat & Ketentuan (opsional)" rows="2"></textarea></div>
            <div class="col-12 text-end mt-2">
               <button class="btn btn-light me-2" onclick="document.getElementById('event-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-event-btn" onclick="saveNewEventBanner()">Simpan Banner</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  grid.insertAdjacentHTML('beforebegin', formHtml);

  const upload = document.getElementById('event-upload-area');
  const input = document.getElementById('event-file-input');
  if (upload && input) {
    upload.onclick = () => input.click();
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast('Memproses banner event...', 'info');
        const optimizedFile = await optimizeImage(file, 1350);
        pendingUploads['new_event'] = optimizedFile;
        const reader = new FileReader();
        reader.onload = (re) => {
          document.getElementById('event-preview').src = re.target.result;
          document.getElementById('event-preview').style.display = 'block';
          document.getElementById('event-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(optimizedFile);
      }
    };
  }
};


// Simpan banner event baru (id auto-generate "event_<timestamp>") ke site_content.
window.saveNewEventBanner = async () => {
  if (!pendingUploads['new_event']) { showToast('Wajib memilih foto banner!', 'error'); return; }
  
  const btn = document.getElementById('submit-event-btn');
  const titleVal   = document.getElementById('event-title')?.value   || '';
  const dateVal    = document.getElementById('event-date')?.value    || '';
  const benefitVal = document.getElementById('event-benefit')?.value || '';
  const tncVal     = document.getElementById('event-tnc')?.value     || '';

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    const imageUrl = await uploadAndOptimizeImage(pendingUploads['new_event'], 'event', 1400);
    delete pendingUploads['new_event'];
    
    // Save to site_content table with event_ prefix
    const eventId = `event_${Date.now()}`;
    // NOTE: Kolom 'tnc' harus ditambahkan dulu di Supabase Dashboard sebelum bisa digunakan.
    // Cara: Table Editor → site_content → Add Column → name: tnc, type: text
    const insertPayload = {
      id: eventId,
      image_url: imageUrl,
      is_active: true,
      title:     titleVal    || null,
      subtitle:  dateVal     || null,
      subtitle2: benefitVal  || null,
      updated_at: new Date().toISOString()
    };
    // Hanya kirim tnc jika kolom sudah ada (hindari crash schema)
    if (tncVal) {
      try {
        const testCheck = await sb.from('site_content').select('tnc').limit(1);
        if (!testCheck.error) insertPayload.tnc = tncVal;
      } catch(e) { /* kolom belum ada, skip */ }
    }
    const { error } = await sb.from('site_content').insert(insertPayload);

    if (error) throw error;

    showToast('Event banner berhasil ditambahkan!');
    document.getElementById('event-form-area').remove();
    delete pendingUploads['new_event'];
    loadContent();
  } catch (err) {
    showToast('Gagal menambah event: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Simpan Banner'; }
  }
}

// Global expose
window.toggleEventActive = toggleEventActive;
window.deleteEvent = deleteEvent;
window.loadEventsAdmin = loadEventsAdmin;
window.renderEventsAdmin = renderEventsAdmin;

// Edit Event Logic
window.editEvent = (id) => {
  const ev = eventsAdminData.find(e => e.id === id);
  if (!ev) return;

  const existingForm = document.getElementById('edit-event-form-area');
  if (existingForm) existingForm.remove();

  const formHtml = `
    <div id="edit-event-form-area" class="drink-form-container fade-up mt-4" style="border: 2px solid var(--primary-color);">
      <h4 class="mb-3">Edit Event Banner</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="edit-event-upload-area">
            <img id="edit-event-preview" src="${ev.image_url || './asset/hero1.webp'}" class="img-preview" style="display:block; object-fit: contain; aspect-ratio: 5/4; background: #f0f0f0;">
            <div class="upload-overlay">
              <i class="bi bi-camera"></i><span>Ganti Foto</span>
            </div>
          </div>
          <input type="file" id="edit-event-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Nama Event</label>
              <input type="text" id="edit-event-title" class="form-input" placeholder="Nama Event" value="${(ev.title || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Tanggal/Periode</label>
              <input type="text" id="edit-event-date" class="form-input" placeholder="Tanggal/Periode" value="${(ev.subtitle || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Keuntungan / Deskripsi</label>
              <textarea id="edit-event-benefit" class="form-input" placeholder="Keuntungan" rows="2">${ev.subtitle2 || ''}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Syarat &amp; Ketentuan</label>
              <textarea id="edit-event-tnc" class="form-input" placeholder="Syarat & Ketentuan (opsional)" rows="2">${ev.tnc || ''}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Link/URL Detail (Opsional)</label>
              <input type="url" id="edit-event-link" class="form-input" placeholder="URL Lengkap (Opsional)" value="${(ev.button_url || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="col-12 text-end mt-3">
               <button class="btn btn-light me-2" onclick="document.getElementById('edit-event-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-edit-event-btn" onclick="saveEditEventBanner('${ev.id}')">
                 Simpan Perubahan
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('events-view').insertBefore(createDiv(formHtml), document.getElementById('events-grid'));

  const upload = document.getElementById('edit-event-upload-area');
  const input = document.getElementById('edit-event-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Memproses banner...', 'info');
      const optimizedFile = await optimizeImage(file, 1350);
      pendingUploads['edit_event'] = optimizedFile;
      
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('edit-event-preview').src = re.target.result;
      };
      reader.readAsDataURL(optimizedFile);
    }
  };
  
  document.getElementById('edit-event-form-area').scrollIntoView({ behavior: 'smooth' });
};

// Simpan hasil edit banner event (upload foto baru kalau ada, lalu upsert field-fieldnya).
window.saveEditEventBanner = async (id) => {
  const titleVal   = document.getElementById('edit-event-title')?.value   || '';
  const dateVal    = document.getElementById('edit-event-date')?.value    || '';
  const benefitVal = document.getElementById('edit-event-benefit')?.value || '';
  const tncVal     = document.getElementById('edit-event-tnc')?.value     || '';
  const linkVal    = document.getElementById('edit-event-link')?.value    || '';

  const btn = document.getElementById('submit-edit-event-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Mengupdate...';

  try {
    const ev = eventsAdminData.find(e => e.id === id);
    if (!ev) throw new Error('Data event tidak ditemukan, coba refresh halaman.');
    let imageUrl = ev.image_url;

    if (pendingUploads['edit_event']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['edit_event'], 'event', 1400);
      delete pendingUploads['edit_event'];
    }

    // NOTE: Kolom 'tnc' harus ditambahkan dulu di Supabase Dashboard sebelum bisa digunakan.
    const updatePayload = {
      title:      titleVal   || null,
      subtitle:   dateVal    || null,
      subtitle2:  benefitVal || null,
      button_url: linkVal    || null,
      image_url:  imageUrl,
      updated_at: new Date().toISOString()
    };
    // Hanya kirim tnc jika ada isinya (hindari crash schema jika kolom belum ada)
    if (tncVal) {
      try {
        const testCheck = await sb.from('site_content').select('tnc').limit(1);
        if (!testCheck.error) updatePayload.tnc = tncVal;
      } catch(e) { /* kolom belum ada, skip */ }
    }
    const { error } = await sb.from('site_content').update(updatePayload).eq('id', id);

    if (error) throw error;

    showToast('Event berhasil diperbarui!');
    document.getElementById('edit-event-form-area').remove();
    delete pendingUploads['edit_event'];
    loadContent();
  } catch (err) {
    showToast('Gagal mengubah event: ' + err.message, 'error');
  } finally {
    if(btn) {
      btn.disabled = false;
      btn.innerHTML = 'Simpan Perubahan';
    }
  }
};

// ===== NEWS MANAGEMENT (DATA FROM site_content) =====

function loadNewsAdmin() {
  // Data is now pre-loaded by loadContent()
  renderNewsAdmin();
}

// Render kartu-kartu berita ke grid.
function renderNewsAdmin() {
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  if (newsAdminData.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Belum ada berita di site_content. Klik "Tambah Berita".</p></div>`;
    return;
  }

  grid.innerHTML = newsAdminData.map(n => `
    <div class="drink-admin-card" id="news-card-${n.id}">
      ${n.image_url ? `<img src="${n.image_url}" class="drink-admin-img" alt="News" style="object-fit: cover; aspect-ratio: 4/3;">` : ''}
      <div class="drink-admin-body">
        <div class="drink-admin-name">${n.title || '(Tanpa Judul)'}</div>
        <div class="drink-admin-meta">
          <span class="drink-admin-badge ${n.is_active !== false ? 'bg-success text-white' : 'bg-danger text-white'}">${n.is_active !== false ? 'Aktif' : 'Off'}</span>
          <span class="small text-muted d-block mt-1" style="font-size:0.7rem">${(n.subtitle || '').substring(0, 80)}${(n.subtitle || '').length > 80 ? '…' : ''}</span>
        </div>
        <div class="drink-admin-actions mt-3">
          <button class="btn-icon" onclick="editNews('${n.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon ${n.is_active !== false ? '' : 'text-success'}" onclick="toggleNewsActive('${n.id}', ${n.is_active === false})" title="${n.is_active !== false ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${n.is_active !== false ? 'bi-eye-slash' : 'bi-eye'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteNews('${n.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

// Aktif/nonaktifin satu berita.
async function toggleNewsActive(id, state) {
  try {
    const { error } = await sb.from('site_content').update({ is_active: state }).eq('id', id);
    if (error) throw error;
    showToast('Status berita diperbarui');
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
}

// Hapus satu berita secara permanen dari DB.
async function deleteNews(id) {
  if (!confirm('Hapus berita ini dari site_content?')) return;
  try {
    const { data, error } = await sb.from('site_content').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel site_content Supabase Anda.');
    }
    showToast('Berita dihapus.');
    loadContent();
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}

// Tambah Berita UI & Logic. Foto opsional - beda dari Event yang wajib foto.
window.showAddNewsForm = () => {
  const grid = document.getElementById('news-grid');
  if (!grid) return;

  const existingForm = document.getElementById('news-form-area');
  if (existingForm) { existingForm.remove(); return; }

  const formHtml = `
    <div id="news-form-area" class="drink-form-container fade-up mb-4" style="border: 2px solid var(--accent); background: white;">
      <h4 class="mb-3">Tambah Berita</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="news-upload-area">
            <img id="news-preview" src="" class="img-preview" style="display:none; object-fit: cover; aspect-ratio: 4/3;">
            <div class="upload-placeholder" id="news-placeholder">
              <i class="bi bi-plus-circle"></i><p>Pilih Foto (opsional)</p>
            </div>
          </div>
          <input type="file" id="news-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12"><input type="text" id="news-title" class="form-input" placeholder="Judul Berita (misal: Lowongan Kerja Outlet Sanur)"></div>
            <div class="col-12"><textarea id="news-body" class="form-input" placeholder="Isi Berita" rows="4"></textarea></div>
            <div class="col-12 text-end mt-2">
               <button class="btn btn-light me-2" onclick="document.getElementById('news-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-news-btn" onclick="saveNewNews()">Simpan Berita</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  grid.insertAdjacentHTML('beforebegin', formHtml);

  const upload = document.getElementById('news-upload-area');
  const input = document.getElementById('news-file-input');
  if (upload && input) {
    upload.onclick = () => input.click();
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        showToast('Memproses foto...', 'info');
        const optimizedFile = await optimizeImage(file, 1200);
        pendingUploads['new_news'] = optimizedFile;
        const reader = new FileReader();
        reader.onload = (re) => {
          document.getElementById('news-preview').src = re.target.result;
          document.getElementById('news-preview').style.display = 'block';
          document.getElementById('news-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(optimizedFile);
      }
    };
  }
};

// Simpan berita baru (id auto-generate "news_<timestamp>") ke site_content. Foto opsional.
window.saveNewNews = async () => {
  const btn = document.getElementById('submit-news-btn');
  const titleVal = document.getElementById('news-title')?.value || '';
  const bodyVal  = document.getElementById('news-body')?.value  || '';

  if (!titleVal.trim()) { showToast('Judul berita wajib diisi!', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    let imageUrl = null;
    if (pendingUploads['new_news']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['new_news'], 'news', 1200);
      delete pendingUploads['new_news'];
    }

    const newsId = `news_${Date.now()}`;
    const { error } = await sb.from('site_content').insert({
      id: newsId,
      image_url: imageUrl,
      is_active: true,
      title: titleVal,
      subtitle: bodyVal || null,
      updated_at: new Date().toISOString()
    });

    if (error) throw error;

    showToast('Berita berhasil ditambahkan!');
    document.getElementById('news-form-area').remove();
    delete pendingUploads['new_news'];
    loadContent();
  } catch (err) {
    showToast('Gagal menambah berita: ' + err.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = 'Simpan Berita'; }
  }
};

// Global expose
window.toggleNewsActive = toggleNewsActive;
window.deleteNews = deleteNews;
window.loadNewsAdmin = loadNewsAdmin;
window.renderNewsAdmin = renderNewsAdmin;

// Tampilin form edit buat satu berita (isi field dari data yang ada). Foto opsional.
window.editNews = (id) => {
  const n = newsAdminData.find(x => x.id === id);
  if (!n) return;

  const existingForm = document.getElementById('edit-news-form-area');
  if (existingForm) existingForm.remove();

  const formHtml = `
    <div id="edit-news-form-area" class="drink-form-container fade-up mt-4" style="border: 2px solid var(--primary-color);">
      <h4 class="mb-3">Edit Berita</h4>
      <div class="row g-3">
        <div class="col-md-4">
          <div class="upload-area" id="edit-news-upload-area">
            <img id="edit-news-preview" src="${n.image_url || ''}" class="img-preview" style="display:${n.image_url ? 'block' : 'none'}; object-fit: cover; aspect-ratio: 4/3;">
            <div class="upload-placeholder" id="edit-news-placeholder" style="display:${n.image_url ? 'none' : 'flex'}">
              <i class="bi bi-plus-circle"></i><p>Pilih Foto (opsional)</p>
            </div>
            <div class="upload-overlay">
              <i class="bi bi-camera"></i><span>Ganti Foto</span>
            </div>
          </div>
          <input type="file" id="edit-news-file-input" accept="image/*" style="display:none">
        </div>
        <div class="col-md-8">
          <div class="row g-2">
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Judul Berita</label>
              <input type="text" id="edit-news-title" class="form-input" value="${(n.title || '').replace(/"/g, '&quot;')}">
            </div>
            <div class="col-12">
              <label class="form-label mb-1" style="font-size: 0.8rem; color: #666;">Isi Berita</label>
              <textarea id="edit-news-body" class="form-input" rows="4">${n.subtitle || ''}</textarea>
            </div>
            <div class="col-12 text-end mt-3">
               <button class="btn btn-light me-2" onclick="document.getElementById('edit-news-form-area').remove()">Batal</button>
               <button class="btn btn-dark px-4" id="submit-edit-news-btn" onclick="saveEditNewsItem('${n.id}')">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('news-view').insertBefore(createDiv(formHtml), document.getElementById('news-grid'));

  const upload = document.getElementById('edit-news-upload-area');
  const input = document.getElementById('edit-news-file-input');
  upload.onclick = () => input.click();
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      showToast('Memproses foto...', 'info');
      const optimizedFile = await optimizeImage(file, 1200);
      pendingUploads['edit_news'] = optimizedFile;

      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('edit-news-preview').src = re.target.result;
        document.getElementById('edit-news-preview').style.display = 'block';
        document.getElementById('edit-news-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(optimizedFile);
    }
  };

  document.getElementById('edit-news-form-area').scrollIntoView({ behavior: 'smooth' });
};

// Simpan hasil edit berita (upload foto baru kalau ada, lalu update field-fieldnya).
window.saveEditNewsItem = async (id) => {
  const titleVal = document.getElementById('edit-news-title')?.value || '';
  const bodyVal  = document.getElementById('edit-news-body')?.value  || '';

  const btn = document.getElementById('submit-edit-news-btn');
  if (!btn) return;
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Mengupdate...';

  try {
    const n = newsAdminData.find(x => x.id === id);
    if (!n) throw new Error('Data berita tidak ditemukan, coba refresh halaman.');
    let imageUrl = n.image_url;

    if (pendingUploads['edit_news']) {
      imageUrl = await uploadAndOptimizeImage(pendingUploads['edit_news'], 'news', 1200);
      delete pendingUploads['edit_news'];
    }

    const { error } = await sb.from('site_content').update({
      title: titleVal || null,
      subtitle: bodyVal || null,
      image_url: imageUrl,
      updated_at: new Date().toISOString()
    }).eq('id', id);

    if (error) throw error;

    showToast('Berita berhasil diperbarui!');
    document.getElementById('edit-news-form-area').remove();
    delete pendingUploads['edit_news'];
    loadContent();
  } catch (err) {
    showToast('Gagal mengubah berita: ' + err.message, 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Simpan Perubahan';
    }
  }
};

// ===== FAQ MANAGEMENT (DATA FROM site_content) =====

function loadFaqAdmin() {
  // Data is now pre-loaded by loadContent() in Master Loader
  renderFaqAdmin();
}

// Render kartu-kartu FAQ ke grid.
function renderFaqAdmin() {
  const grid = document.getElementById('faq-grid');
  if(!grid) return;
  
  if (faqAdminData.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="p-4 rounded-4" style="background:#e8f4fd; border:2px dashed #0d6efd; max-width:620px; margin:0 auto;">
          <h5 class="fw-bold mb-2 text-primary"><i class="bi bi-cloud-arrow-down-fill me-2"></i>Belum Ada FAQ di Database Supabase</h5>
          <p class="text-muted small mb-4">Website saat ini menampilkan 4 FAQ default (Kemitraan, Karir, Kualitas Minuman, Kontak Email). Klik tombol di bawah ini untuk menyalin keempat FAQ tersebut ke Supabase Anda sehingga siap diedit!</p>
          <button class="btn btn-primary px-4 py-2 fw-bold shadow-sm" id="btn-seed-faq" onclick="seedDefaultFaqs()">
            <i class="bi bi-cloud-download me-2"></i>Import 4 FAQ Bawaan Website ke Supabase
          </button>
        </div>
      </div>`;
    return;
  }

  grid.innerHTML = faqAdminData.map(f => `
    <div class="drink-admin-card">
      <div class="drink-admin-body">
        <div class="drink-admin-name" style="font-size:1rem; min-height:3em;">${f.title}</div>
        <p class="text-muted small mt-1 line-clamp-2">${f.subtitle || 'Tidak ada jawaban.'}</p>
        <div class="drink-admin-meta mt-2">
          <span class="drink-admin-badge ${f.is_active ? 'bg-success text-white' : 'bg-danger text-white'}">${f.is_active ? 'Aktif' : 'Off'}</span>
        </div>
        <div class="drink-admin-actions mt-3">
          <button class="btn-icon" onclick="editFaq('${f.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon ${f.is_active ? '' : 'text-success'}" onclick="toggleFaqActiveAdmin('${f.id}', ${!f.is_active})" title="${f.is_active ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${f.is_active ? 'bi-eye-slash' : 'bi-eye'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteFaqAdmin('${f.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

window.seedDefaultFaqs = async () => {
  const btn = document.getElementById('btn-seed-faq');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-2"></i>Mengimpor ke Supabase...';
  }
  showToast('Sedang mengimpor 4 FAQ default ke database...', 'info');

  const defaultFaqs = [
    {
      id: 'faq_1_kemitraan',
      title: 'Apakah Teiko membuka kemitraan atau franchise?',
      subtitle: 'Saat ini kami belum membuka sistem kemitraan (franchise). Seluruh outlet Teiko dikelola langsung oleh tim manajemen pusat untuk menjaga kualitas dan cita rasa terbaik. Informasi resmi mengenai pembukaan kemitraan di masa mendatang hanya akan diumumkan melalui kanal resmi Teiko.',
      is_active: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'faq_2_karir',
      title: 'Bagaimana cara melamar pekerjaan atau bergabung dengan tim Teiko?',
      subtitle: 'Kami terus mencari talenta dan pekerja bersemangat untuk bergabung bersama keluarga besar Teiko! Kamu bisa mengirimkan CV dan surat lamaran terbaru kamu melalui email resmi kami ke support@teiko.co.id dengan subjek lamaran kerja.',
      is_active: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'faq_3_kualitas',
      title: 'Apakah seluruh minuman di Teiko menggunakan bahan segar dan berkualitas?',
      subtitle: 'Tentu! Setiap minuman teh, kopi, dan krim spesial di Teiko diracik menggunakan daun teh asli pilihan, biji kopi premium, serta susu dan bahan alami berkualitas tinggi.',
      is_active: true,
      updated_at: new Date().toISOString()
    },
    {
      id: 'faq_4_email',
      title: 'Bagaimana cara menghubungi kontak resmi email Teiko sesuai keperluan?',
      subtitle: 'Kami memiliki 3 alamat email resmi sesuai fungsinya:\\n• info@teiko.co.id : untuk informasi Broadcast & Media.\\n• support@teiko.co.id : untuk proses Hiring, lowongan kerja & pengiriman CV.\\n• sales@teiko.co.id : untuk komunikasi dengan distributor/reseller terkait stok, harga, atau promo.',
      is_active: true,
      updated_at: new Date().toISOString()
    }
  ];

  try {
    const { error } = await sb.from('site_content').upsert(defaultFaqs);
    if (error) throw error;
    showToast('4 FAQ Bawaan berhasil diimpor ke Supabase! Sekarang siap diedit.', 'success');
    await loadContent();
  } catch (err) {
    showToast('Gagal mengimpor FAQ: ' + err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-cloud-download me-2"></i>Coba Import Lagi';
    }
  }
};

// Tambah FAQ UI
window.showAddFaqForm = () => {
  const existingForm = document.getElementById('faq-form-area');
  if (existingForm) { existingForm.remove(); return; }

  const formHtml = `
    <div id="faq-form-area" class="drink-form-container fade-up mb-4" style="border: 2px solid var(--primary-color);">
      <h4 class="mb-3">Tambah FAQ Baru</h4>
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label small text-muted mb-1">Pertanyaan</label>
          <input type="text" id="faq-q" class="form-input" placeholder="Apa itu Teiko?">
        </div>
        <div class="col-12">
          <label class="form-label small text-muted mb-1">Jawaban</label>
          <textarea id="faq-a" class="form-input" placeholder="Masukkan jawaban di sini..." rows="3"></textarea>
        </div>
        <div class="col-12 text-end mt-2">
           <button class="btn btn-light me-2" onclick="document.getElementById('faq-form-area').remove()">Batal</button>
           <button class="btn btn-dark px-4" id="submit-faq-btn" onclick="saveNewFaq()">Simpan FAQ</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('faq-view').insertBefore(createDiv(formHtml), document.getElementById('faq-grid'));
};

// Simpan FAQ baru (id auto-generate "faq_<timestamp>") ke site_content.
window.saveNewFaq = async () => {
  const q = document.getElementById('faq-q').value;
  const a = document.getElementById('faq-a').value;
  if(!q || !a) { showToast('Pertanyaan & Jawaban wajib diisi!', 'error'); return; }

  const btn = document.getElementById('submit-faq-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    const { error } = await sb.from('site_content').insert({
      id: `faq_${Date.now()}`,
      title: q,
      subtitle: a,
      is_active: true,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
    showToast('FAQ berhasil ditambahkan!');
    document.getElementById('faq-form-area').remove();
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Simpan FAQ'; }
  }
};

// Tampilin form edit buat satu FAQ (isi field dari data yang ada).
window.editFaq = (id) => {
  const f = faqAdminData.find(x => x.id === id);
  if (!f) return;

  const existingForm = document.getElementById('edit-faq-form-area');
  if (existingForm) existingForm.remove();

  const formHtml = `
    <div id="edit-faq-form-area" class="drink-form-container fade-up mb-4" style="border: 2px solid var(--primary-color);">
      <h4 class="mb-3">Edit FAQ</h4>
      <div class="row g-3">
        <div class="col-12">
          <label class="form-label small text-muted mb-1">Pertanyaan</label>
          <input type="text" id="edit-faq-q" class="form-input" value="${f.title}">
        </div>
        <div class="col-12">
          <label class="form-label small text-muted mb-1">Jawaban</label>
          <textarea id="edit-faq-a" class="form-input" rows="3">${f.subtitle || ''}</textarea>
        </div>
        <div class="col-12 text-end mt-2">
           <button class="btn btn-light me-2" onclick="document.getElementById('edit-faq-form-area').remove()">Batal</button>
           <button class="btn btn-dark px-4" id="submit-edit-faq-btn" onclick="saveEditFaq('${f.id}')">Update FAQ</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('faq-view').insertBefore(createDiv(formHtml), document.getElementById('faq-grid'));
  document.getElementById('edit-faq-form-area').scrollIntoView({ behavior: 'smooth' });
};

// Simpan hasil edit FAQ (pertanyaan & jawaban).
window.saveEditFaq = async (id) => {
  const q = document.getElementById('edit-faq-q').value;
  const a = document.getElementById('edit-faq-a').value;
  const btn = document.getElementById('submit-edit-faq-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Updating...';

  try {
    const { error } = await sb.from('site_content').update({
      title: q,
      subtitle: a,
      updated_at: new Date().toISOString()
    }).eq('id', id);
    if (error) throw error;
    showToast('FAQ diperbarui!');
    document.getElementById('edit-faq-form-area').remove();
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Update FAQ'; }
  }
};

// Aktif/nonaktifin satu FAQ.
window.toggleFaqActiveAdmin = async (id, state) => {
  try {
    const { error } = await sb.from('site_content').update({ is_active: state }).eq('id', id);
    if (error) throw error;
    showToast('Status FAQ diperbarui.');
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
};

// Hapus satu FAQ secara permanen dari DB.
window.deleteFaqAdmin = async (id) => {
  if (!confirm('Hapus FAQ ini secara permanen?')) return;
  try {
    const { data, error } = await sb.from('site_content').delete().eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error('0 baris terhapus. Periksa kebijakan RLS (Row Level Security) untuk izin DELETE di tabel site_content Supabase Anda.');
    }
    showToast('FAQ telah dihapus.');
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
};

// Final Global Assignments
window.loadEventsAdmin = loadEventsAdmin;
window.loadFaqAdmin    = loadFaqAdmin;
window.loadNewsAdmin   = loadNewsAdmin;
window.toggleEventPrimary = toggleEventPrimary;

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
  console.log('DEBUG: DOM fully loaded, starting admin initialization');
  if (typeof sb === 'undefined') {
    alert('CRITICAL: Supabase tidak terdeteksi. Periksa koneksi internet atau file supabase-config.js');
    return;
  }
  checkAuth();
});

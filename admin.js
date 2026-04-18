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
window.saveNewEventBanner = () => {};
window.saveNewFaq = () => {};
window.loadEventsAdmin = () => {};
window.loadFaqAdmin = () => {};

console.log('DEBUG: admin.js initialization started');


const SECTIONS = [
  {
    id: 'hero1',
    label: 'Hero Section 1',
    emoji: '🖼️',
    defaultImg: './asset/hero1.webp',
    fields: [
      { key: 'title',       label: 'Judul Utama',     type: 'textarea', placeholder: 'ENGGA PERLU MIKIR 2 KALI\nRASANYA BIKIN NAGIH' },
      { key: 'subtitle',    label: 'Deskripsi',        type: 'textarea', placeholder: 'Minum puas, bayar hemat bareng Teiko.' },
      { key: 'button_text', label: 'Teks Tombol',      type: 'text',     placeholder: 'Lihat Menu Kami' },
      { key: 'button_url',  label: 'Link Tombol',      type: 'text',     placeholder: 'drinks' },
    ]
  },
  {
    id: 'hero2',
    label: 'Hero Section 2',
    emoji: '🖼️',
    defaultImg: './asset/hero2.webp',
    fields: [
      { key: 'title',     label: 'Judul',       type: 'textarea', placeholder: 'NEW MENU\nES COKLAT' },
      { key: 'subtitle',  label: 'Paragraf 1',  type: 'textarea', placeholder: '"Pendatang baru, langsung nomor satu...' },
      { key: 'subtitle2', label: 'Paragraf 2',  type: 'textarea', placeholder: 'yang creamy menciptakan rasa mewah...' },
    ]
  },
  {
    id: 'hero3',
    label: 'Hero Section 3',
    emoji: '🖼️',
    defaultImg: './asset/hero1.webp',
    fields: [
      { key: 'title',     label: 'Judul',       type: 'textarea', placeholder: 'PROMO SPESIAL\nAKHIR PEKAN' },
      { key: 'subtitle',  label: 'Paragraf 1',  type: 'textarea', placeholder: 'Nikmati kesegaran Teiko dengan...' },
      { key: 'subtitle2', label: 'Paragraf 2',  type: 'textarea', placeholder: 'Jangan sampai kehabisan...' },
    ]
  },
  {
    id: 'hot_series',
    label: 'HOT SERIES',
    emoji: '☕',
    defaultImg: './asset/3.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'HOT SERIES' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rangkaian minuman hangat Teiko...' },
    ]
  },
  {
    id: 'green_tea',
    label: 'GREEN TEA',
    emoji: '🍵',
    defaultImg: './asset/4.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'GREEN TEA' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rasakan kesegaran teh hijau asli Jepang.' },
    ]
  },
  {
    id: 'belgian',
    label: 'BELGIAN',
    emoji: '🍫',
    defaultImg: './asset/5.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'BELGIAN' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rasakan kesegaran Belgian Choco...' },
    ]
  },
  {
    id: 'coffee_cream',
    label: 'COFFEE CREAM',
    emoji: '🥛',
    defaultImg: './asset/6.svg',
    fields: [
      { key: 'title',    label: 'Judul',      type: 'text',     placeholder: 'COFFEE CREAM' },
      { key: 'subtitle', label: 'Deskripsi',  type: 'textarea', placeholder: 'Rasa kopi lembut berpadu krim spesial Teiko.' },
    ]
  }
];

let contentData = {};
let pendingUploads = {};
let drinksData = [];
let eventsAdminData = [];
let faqAdminData = [];

// ===== AUTH =====
async function checkAuth() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    showDashboard(session.user);
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('dashboard').style.display = 'none';
}

function showDashboard(user) {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';
  if (user) {
    document.getElementById('admin-email-display').textContent = user.email;
  }
  
  // Master Initial Load: Load everything once
  fetchAllData();
}

async function fetchAllData() {
  showToast('Menyelaraskan data...', 'info');
  await Promise.all([
    loadContent(true), // Content, Events, FAQ from site_content
    loadDrinks(true)   // Drinks from drinks table
  ]);
  showToast('Data disinkronkan', 'success');
}

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

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  showLogin();
  showToast('Berhasil keluar.', 'success');
});

// ===== CONTENT =====
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

    data.forEach(row => {
      if (row.id.startsWith('event_')) {
        eventsAdminData.push(row);
      } else if (row.id.startsWith('faq_')) {
        faqAdminData.push(row);
      } else {
        // Hero / Other site content
        contentData[row.id] = row;
      }
    });
    
    // Sort events by ID desc
    eventsAdminData.sort((a, b) => b.id.localeCompare(a.id));

    // Update Stats
    const syncedEl = document.getElementById('stat-synced');
    if (syncedEl) syncedEl.textContent = Object.keys(contentData).length + eventsAdminData.length + faqAdminData.length;

    renderSections();
    renderEventsAdmin();
    renderFaqAdmin();
  } catch (err) {
    showToast('Gagal memuat: ' + err.message, 'error');
  }
}

function renderSections() {
  const grid = document.getElementById('sections-grid');
  if (!grid) return;
  
  const allSections = [];
  
  // 1. Static Sections
  SECTIONS.forEach(s => {
    allSections.push(s);
  });

  // 2. Dynamic Heroes from DB
  Object.values(contentData).forEach(row => {
    if (row.id.startsWith('hero') && !SECTIONS.find(s => s.id === row.id)) {
      allSections.push({
        id: row.id,
        label: `Dynamic Hero`,
        emoji: '✨',
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

function createSectionCard(section) {
  const data = contentData[section.id] || {};
  const imgSrc = data.image_url || section.defaultImg;
  const isActive = data.is_active !== false;

  return `
    <div class="drink-admin-card" id="card-${section.id}">
      <img src="${imgSrc}" class="drink-admin-img" alt="Preview" style="object-fit: cover; aspect-ratio: 16/9;">
      <div class="drink-admin-body">
        <div class="drink-admin-name">${section.label} <small class="text-muted" style="font-size:0.7rem">(${section.id})</small></div>
        <div class="drink-admin-meta">
           <span class="drink-admin-badge ${isActive ? 'bg-success text-white' : 'bg-danger text-white'}" id="badge-${section.id}">${isActive ? 'Aktif' : 'Off'}</span>
        </div>
        <div class="drink-admin-actions">
          <button class="btn-icon" onclick="editContent('${section.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
          <button class="btn-icon ${isActive ? '' : 'text-success'}" id="toggle-btn-${section.id}" onclick="toggleSection('${section.id}')" title="${isActive ? 'Matikan' : 'Aktifkan'}">
            <i class="bi ${isActive ? 'bi-toggle-on' : 'bi-toggle-off'}"></i>
          </button>
          <button class="btn-icon btn-icon-danger" onclick="deleteSection('${section.id}')" title="Hapus"><i class="bi bi-trash"></i></button>
        </div>
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

window.saveEditContent = async (id) => {
  const btn = document.getElementById('submit-content-btn');
  const section = SECTIONS.find(s => s.id === id) || { fields: [] };
  
  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    let imageUrl = contentData[id]?.image_url || null;

    if (pendingUploads[id]) {
      const file = pendingUploads[id];
      const filename = `${id}_${Date.now()}.${file.name.split('.').pop()}`;
      await sb.storage.from('site-images').upload(filename, file);
      const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
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

function handleFileSelect(sectionId, file) {
  pendingUploads[sectionId] = file;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById(`preview-${sectionId}`);
    preview.src = e.target.result;
    preview.style.display = 'block';
    document.getElementById(`placeholder-${sectionId}`).style.display = 'none';
  };
  reader.readAsDataURL(file);

  document.getElementById(`hint-${sectionId}`).textContent = `📁 ${file.name} — siap diupload`;
}

async function saveSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  const btn = document.getElementById(`save-btn-${sectionId}`);

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    let imageUrl = contentData[sectionId]?.image_url || null;

    // Upload foto jika ada file baru
    if (pendingUploads[sectionId]) {
      const file = pendingUploads[sectionId];
      const ext = file.name.split('.').pop().toLowerCase();
      const filename = `${sectionId}.${ext}`;

      const { error: uploadError } = await sb.storage
        .from('site-images')
        .upload(filename, file, { upsert: true, contentType: file.type });

      if (uploadError) throw new Error('Upload gagal: ' + uploadError.message);

      const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
      // Tambah cache-buster agar browser refresh gambar
      imageUrl = urlData.publicUrl + '?t=' + Date.now();

      delete pendingUploads[sectionId];
      document.getElementById(`hint-${sectionId}`).textContent = '✅ Foto berhasil diupload';
    }

    // Kumpulkan nilai dari form
    const updateData = { id: sectionId, image_url: imageUrl, updated_at: new Date().toISOString() };
    const allFields = ['title', 'subtitle', 'subtitle2', 'button_text', 'button_url'];

    allFields.forEach(f => {
      const el = document.getElementById(`field-${sectionId}-${f}`);
      updateData[f] = el ? (el.value || null) : null;
    });

    // Simpan ke Supabase
    const { error } = await sb.from('site_content').upsert(updateData);
    if (error) throw new Error('DB error: ' + error.message);

    contentData[sectionId] = updateData;
    showToast(`✅ "${section.label}" berhasil disimpan!`, 'success');

  } catch (err) {
    showToast('❌ ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check2-circle"></i> Simpan Perubahan';
  }
}

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
    const { error } = await sb.from('site_content').upsert(updateData);
    if (error) throw new Error(error.message);
    
    currentData.is_active = newActiveState;
    contentData[sectionId] = currentData;
    showToast(`Section berhasil ${newActiveState ? 'diaktifkan' : 'dinonaktifkan'}!`, 'success');
  } catch (err) {
    showToast('Gagal mengubah status: ' + err.message, 'error');
  }
}

// ===== DELETE SECTION =====
async function deleteSection(sectionId) {
  if (!confirm('Hapus section ini secara permanen? Jika ini adalah section bawaan (default), menghapusnya dari database akan membuat kontennya kembali kosong / default di website.')) return;
  try {
    const { error } = await sb.from('site_content').delete().eq('id', sectionId);
    if (error) throw error;
    showToast('Section berhasil dihapus!', 'success');
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
const drinksNav    = document.getElementById('nav-drinks');
const eventsNav    = document.getElementById('nav-events');
const feedbackNav  = document.getElementById('nav-feedback');
const faqNav       = document.getElementById('nav-faq');
const contentView  = document.getElementById('content-view');
const drinksView   = document.getElementById('drinks-view');
const eventsView   = document.getElementById('events-view');
const feedbackView = document.getElementById('feedback-view');
const faqView      = document.getElementById('faq-view');

const allNavs  = [contentNav, drinksNav, eventsNav, feedbackNav, faqNav];
const allViews = [contentView, drinksView, eventsView, feedbackView, faqView];

function activateView(navId, viewId, loaderCallback) {
  allNavs.forEach(nav => { if (nav) nav.classList.remove('active'); });
  const activeNav = document.getElementById(navId);
  if (activeNav) activeNav.classList.add('active');

  allViews.forEach(view => { if (view) view.style.display = 'none'; });
  const activeView = document.getElementById(viewId);
  if (activeView) activeView.style.display = 'block';

  if (loaderCallback) loaderCallback();
}

if (contentNav)  contentNav.addEventListener('click',  () => activateView('nav-content',  'content-view'));
if (drinksNav)   drinksNav.addEventListener('click',   () => activateView('nav-drinks',   'drinks-view'));
if (eventsNav)   eventsNav.addEventListener('click',   () => activateView('nav-events',   'events-view'));
if (feedbackNav) feedbackNav.addEventListener('click', () => activateView('nav-feedback', 'feedback-view', loadFeedback));
if (faqNav)      faqNav.addEventListener('click',      () => activateView('nav-faq',      'faq-view'));

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
              <div class="feedback-user-avatar">💬</div>
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

async function deleteFeedback(id, btn) {
  if (!confirm('Hapus masukan ini?')) return;
  btn.disabled = true;
  try {
    const { error } = await sb.from('feedback').delete().eq('id', id);
    if (error) throw error;
    loadFeedback();
    showToast('Masukan berhasil dihapus.', 'success');
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
    btn.disabled = false;
  }
}
window.deleteFeedback = deleteFeedback;


// ===== DRINKS MANAGEMENT =====

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

function renderDrinks() {
  const grid = document.getElementById('drinks-grid');
  if (drinksData.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Belum ada produk. Klik tombol "+ Tambah Menu Baru".</p></div>`;
    return;
  }

  grid.innerHTML = drinksData.map(drink => `
    <div class="drink-admin-card" id="drink-card-${drink.id}">
      <img src="${drink.image_url || './asset/hero1.webp'}" class="drink-admin-img" alt="Preview">
      <div class="drink-admin-body">
        <div class="drink-admin-name">${drink.name}</div>
        <div class="drink-admin-meta">
          <span class="drink-admin-badge">${drink.oz_size || 'No Size'}</span>
          <span class="drink-admin-badge">${drink.price || 'No Price'}</span>
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
    </div>
  `).join('');
}

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

// createDiv removed (duplicate)

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
      const file = pendingUploads['new_drink'];
      const filename = `drink_${Date.now()}.${file.name.split('.').pop()}`;
      await sb.storage.from('site-images').upload(filename, file);
      const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
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

async function deleteDrink(id) {
  if (!confirm('Hapus minuman ini secara permanen?')) return;
  try {
    const { error } = await sb.from('drinks').delete().eq('id', id);
    if (error) throw error;
    showToast('Minuman dihapus.');
    loadDrinks();
  } catch (err) {
    showToast('Gagal menghapus: ' + err.message, 'error');
  }
}

// Global exposure for onclick handlers
window.toggleDrinkActive = toggleDrinkActive;
window.deleteDrink = deleteDrink;
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
      const file = pendingUploads['edit_drink'];
      const filename = `drink_${Date.now()}.${file.name.split('.').pop()}`;
      await sb.storage.from('site-images').upload(filename, file);
      const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
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

async function saveNewHero() {
  const btn = document.getElementById('submit-new-hero-btn');
  const title = document.getElementById('new-hero-title').value;
  if (!pendingUploads['new_hero']) { showToast('Wajib upload foto hero!', 'error'); return; }

  btn.disabled = true;
  btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Menyimpan...';

  try {
    const file = pendingUploads['new_hero'];
    const filename = `hero_${Date.now()}.${file.name.split('.').pop()}`;
    await sb.storage.from('site-images').upload(filename, file);
    const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
    
    const { error } = await sb.from('site_content').insert({
      id: `hero_${Date.now()}`,
      title: title,
      subtitle: document.getElementById('new-hero-sub1').value,
      subtitle2: document.getElementById('new-hero-sub2').value,
      button_text: document.getElementById('new-hero-btn-text').value,
      button_url: document.getElementById('new-hero-btn-url').value,
      image_url: urlData.publicUrl,
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


async function deleteEvent(id) {
  if (!confirm('Hapus banner event ini dari site_content?')) return;
  try {
    const { error } = await sb.from('site_content').delete().eq('id', id);
    if (error) throw error;
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
    const file = pendingUploads['new_event'];
    const filename = `event_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await sb.storage.from('site-images').upload(filename, file);
    if (uploadError) throw new Error('Upload gagal: ' + uploadError.message);
    const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
    
    // Save to site_content table with event_ prefix
    const eventId = `event_${Date.now()}`;
    // NOTE: Kolom 'tnc' harus ditambahkan dulu di Supabase Dashboard sebelum bisa digunakan.
    // Cara: Table Editor → site_content → Add Column → name: tnc, type: text
    const insertPayload = {
      id: eventId,
      image_url: urlData.publicUrl,
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
      const file = pendingUploads['edit_event'];
      const filename = `event_${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await sb.storage.from('site-images').upload(filename, file);
      if (uploadError) throw new Error('Upload foto gagal: ' + uploadError.message);
      const { data: urlData } = sb.storage.from('site-images').getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
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

// ===== FAQ MANAGEMENT =====
// ===== FAQ MANAGEMENT (DATA FROM site_content) =====

function loadFaqAdmin() {
  // Data is now pre-loaded by loadContent() in Master Loader
  renderFaqAdmin();
}

function renderFaqAdmin() {
  const grid = document.getElementById('faq-grid');
  if(!grid) return;
  
  if (faqAdminData.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center py-5 text-muted"><p>Belum ada FAQ. Klik "Tambah FAQ Baru".</p></div>`;
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
    loadFaqAdmin();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Simpan FAQ'; }
  }
};

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
    loadFaqAdmin();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  } finally {
    if(btn) { btn.disabled = false; btn.innerHTML = 'Update FAQ'; }
  }
};

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

window.deleteFaqAdmin = async (id) => {
  if (!confirm('Hapus FAQ ini secara permanen?')) return;
  try {
    const { error } = await sb.from('site_content').delete().eq('id', id);
    if (error) throw error;
    showToast('FAQ telah dihapus.');
    loadContent();
  } catch (err) {
    showToast('Gagal: ' + err.message, 'error');
  }
};

// Final Global Assignments
window.loadEventsAdmin = loadEventsAdmin;
window.loadFaqAdmin    = loadFaqAdmin;
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

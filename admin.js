// ============================================
// TEIKO ADMIN PANEL - admin.js
// ============================================

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
  loadContent();
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
async function loadContent() {
  const container = document.getElementById('sections-grid');
  container.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Memuat konten dari database...</p>
    </div>`;

  try {
    const { data, error } = await sb.from('site_content').select('*');
    if (error) throw error;

    // Urutkan di sisi client jika created_at ada, agar tidak error jika kolom belum dibuat
    if (data.length > 0 && data[0].hasOwnProperty('created_at')) {
      data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }

    contentData = {};
    data.forEach(row => { contentData[row.id] = row; });
    
    // Update Stat
    const syncedEl = document.getElementById('stat-synced');
    if (syncedEl) syncedEl.textContent = data.length;

    renderSections(data);
  } catch (err) {
    showToast('Gagal memuat data: ' + err.message, 'error');
  }
}

function renderSections(dbData) {
  const grid = document.getElementById('sections-grid');
  
  // Combine static definitions with dynamic database entries
  const allSections = [];
  
  // 1. First, handle known sections from SECTIONS array
  SECTIONS.forEach(s => {
    allSections.push(s);
  });

  // 2. Then, add dynamic heroes that are not in SECTIONS but are in DB
  dbData.forEach(row => {
    if (row.id.startsWith('hero') && !SECTIONS.find(s => s.id === row.id)) {
      allSections.push({
        id: row.id,
        label: `Dynamic Hero (${row.id})`,
        emoji: '✨',
        defaultImg: './asset/hero1.webp',
        fields: [
          { key: 'title',     label: 'Judul',       type: 'textarea', placeholder: 'Judul Baru' },
          { key: 'subtitle',  label: 'Paragraf 1',  type: 'textarea', placeholder: 'Keterangan 1' },
          { key: 'subtitle2', label: 'Paragraf 2',  type: 'textarea', placeholder: 'Keterangan 2' },
        ]
      });
    }
  });

  grid.innerHTML = allSections.map(s => createSectionCard(s)).join('');

  // Re-attach listeners
  allSections.forEach(section => {
    const uploadArea = document.getElementById(`upload-area-${section.id}`);
    const fileInput = document.getElementById(`file-input-${section.id}`);

    if (uploadArea && fileInput) {
      uploadArea.addEventListener('click', () => fileInput.click());
      uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
      uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
      uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFileSelect(section.id, file);
      });

      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) handleFileSelect(section.id, fileInput.files[0]);
      });
    }

    const toggleBtn = document.getElementById(`toggle-btn-${section.id}`);
    if (toggleBtn) toggleBtn.addEventListener('click', () => toggleSection(section.id));

    const saveBtn = document.getElementById(`save-btn-${section.id}`);
    if (saveBtn) saveBtn.addEventListener('click', () => saveSection(section.id));
  });
}

// Add New Hero Logic
async function addNewHero() {
  const newId = 'hero_' + Date.now();
  const newHero = {
    id: newId,
    title: 'HERO BARU',
    subtitle: 'Keterangan hero baru Anda di sini.',
    is_active: true,
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await sb.from('site_content').insert(newHero);
    if (error) throw error;
    
    showToast('Hero baru berhasil ditambahkan! Silakan edit di daftar bawah.', 'success');
    loadContent();
  } catch (err) {
    showToast('Gagal menambah hero: ' + err.message, 'error');
  }
}

function createSectionCard(section) {
  const data = contentData[section.id] || {};
  const imgSrc = data.image_url || section.defaultImg;
  const isActive = data.is_active !== false;

  const fieldsHtml = section.fields.map(field => {
    const value = (data[field.key] || '').replace(/</g, '&lt;');
    if (field.type === 'textarea') {
      return `<div class="field-group">
        <label>${field.label}</label>
        <textarea id="field-${section.id}-${field.key}" placeholder="${field.placeholder || ''}" rows="3">${value}</textarea>
      </div>`;
    }
    return `<div class="field-group">
      <label>${field.label}</label>
      <input type="text" id="field-${section.id}-${field.key}" value="${value}" placeholder="${field.placeholder || ''}">
    </div>`;
  }).join('');

  return `
    <div class="section-card${isActive ? '' : ' inactive'}" id="card-${section.id}">
      <div class="card-header">
        <span class="card-emoji">${section.emoji}</span>
        <h3 class="card-title">${section.label}</h3>
        <span class="card-badge ${isActive ? 'card-badge-active' : 'card-badge-inactive'}" id="badge-${section.id}">${isActive ? 'Aktif' : 'Nonaktif'}</span>
        <button class="btn-toggle" id="toggle-btn-${section.id}" title="${isActive ? 'Nonaktifkan' : 'Aktifkan'} section">
          <i class="bi ${isActive ? 'bi-toggle-on' : 'bi-toggle-off'}"></i>
        </button>
      </div>
      <div class="card-body">
        <div class="upload-area" id="upload-area-${section.id}">
          <img src="${imgSrc}" alt="Preview" class="img-preview" id="preview-${section.id}"
            onerror="this.style.display='none';document.getElementById('placeholder-${section.id}').style.display='flex'">
          <div class="upload-placeholder" id="placeholder-${section.id}" style="display:none">
            <i class="bi bi-cloud-upload"></i>
            <p>Klik atau drag foto di sini</p>
          </div>
          <div class="upload-overlay">
            <i class="bi bi-camera"></i>
            <span>Ganti Foto</span>
          </div>
        </div>
        <input type="file" id="file-input-${section.id}" accept="image/*" style="display:none">
        <div class="upload-hint" id="hint-${section.id}"></div>
        <div class="fields-container">${fieldsHtml}</div>
      </div>
      <div class="card-footer">
        <button class="btn-save" id="save-btn-${section.id}">
          <i class="bi bi-check2-circle"></i> Simpan Perubahan
        </button>
      </div>
    </div>`;
}

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

// ===== TOAST =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast toast-${type} show`;
  setTimeout(() => toast.classList.remove('show'), 4000);
}

// ===== VIEW TOGGLE =====
const contentNav = document.getElementById('nav-content');
const drinksNav = document.getElementById('nav-drinks');
const contentView = document.getElementById('content-view');
const drinksView = document.getElementById('drinks-view');

contentNav.addEventListener('click', () => {
  contentNav.classList.add('active');
  drinksNav.classList.remove('active');
  contentView.style.display = 'block';
  drinksView.style.display = 'none';
  loadContent();
});

drinksNav.addEventListener('click', () => {
  drinksNav.classList.add('active');
  contentNav.classList.remove('active');
  drinksView.style.display = 'block';
  contentView.style.display = 'none';
  loadDrinks();
});

// ===== DRINKS MANAGEMENT =====
let drinksData = [];

async function loadDrinks() {
  const grid = document.getElementById('drinks-grid');
  grid.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Memuat daftar minuman...</p></div>`;

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
            <div class="col-md-6"><input type="text" id="drink-oz" class="form-input" placeholder="Oz / Ukuran (misal: 12 oz)"></div>
            <div class="col-md-6"><input type="text" id="drink-price" class="form-input" placeholder="Harga (misal: 15k)"></div>
            <div class="col-12 text-end">
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
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      pendingUploads['new_drink'] = file;
      const reader = new FileReader();
      reader.onload = (re) => {
        document.getElementById('drink-preview').src = re.target.result;
        document.getElementById('drink-preview').style.display = 'block';
        document.getElementById('drink-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  };
});

function createDiv(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.firstElementChild;
}

async function saveNewDrink() {
  const name = document.getElementById('drink-name').value;
  const oz = document.getElementById('drink-oz').value;
  const price = document.getElementById('drink-price').value;
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
      name, oz_size: oz, price, image_url: imageUrl, is_active: true
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
window.editDrink = (id) => showToast('Fitur edit detail akan segera hadir. Gunakan hapus & tambah ulang untuk saat ini.', 'error');
window.addNewHero = addNewHero;
window.saveNewDrink = saveNewDrink;

// ===== INIT =====
checkAuth();

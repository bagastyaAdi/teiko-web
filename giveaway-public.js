// Section "Event & Giveaway" di homepage (index.html):
// - event dengan giveaway: info event (judul, periode, deskripsi, link detail & S&K, tombol Daftar) sejajar roda undian;
//   tombol Daftar membuka popup form (<dialog>);
// - event lain: kartu biasa di bawahnya.
// Roda berisi nama peserta dari giveaway_public() (tanpa no. telp/struk). Spin hanya dari admin.html;
// di website roda cuma ditonton (update tiap 20 detik, dan langsung setelah seseorang daftar).
(function () {
  if (typeof supabase === 'undefined' || typeof SUPABASE_URL === 'undefined') return;
  // Client publik tanpa sesi login: tidak ikut menunggu kunci sesi Supabase (sempat bikin query pertama ~9 detik).
  const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: 'teiko-public' }
  });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const boards = {}; // eventId -> { wheel, entries }
  let dialog, currentEvent = null;

  const cardHtml = ev => `
    <div class="home-events__card">
      <a href="event"><img src="${esc(ev.image_url)}" alt="${esc(ev.title || 'Event Teiko')}" loading="lazy"></a>
      <div class="home-events__body">
        <h3><a href="event">${esc(ev.title || 'Event Teiko')}</a></h3>
        ${ev.subtitle ? `<p><i class="bi bi-clock me-1"></i>${esc(ev.subtitle)}</p>` : ''}
      </div>
    </div>`;

  async function init() {
    const box = document.getElementById('home-events');
    if (!box) return;
    const { data: events, error } = await db.from('site_content')
      .select('id,title,subtitle,subtitle2,image_url,giveaway,is_active')
      .ilike('id', 'event_%').eq('is_active', true);
    if (error || !events || !events.length) return;
    events.sort((a, b) => b.id.localeCompare(a.id));

    const results = await Promise.all(events.map(ev => db.rpc('giveaway_public', { p_event: ev.id })));
    const withGa = [], others = [];
    events.forEach((ev, i) => {
      const entries = results[i].data || [];
      if (ev.giveaway || entries.length) withGa.push({ ev, entries });
      else if (ev.image_url) others.push(ev);
    });
    if (!withGa.length && !others.length) return;

    box.innerHTML = `
      ${withGa.map(({ ev }) => `
        <div class="ev-ga-row" id="ga-${ev.id}">
          <div class="ga-home__info">
            <span class="ga-home__kicker"><i class="bi bi-gift me-1"></i> Giveaway</span>
            <h2>${esc(ev.title || 'Giveaway Teiko')}</h2>
            ${ev.subtitle ? `<p class="ga-home__period"><i class="bi bi-calendar-event me-1"></i>${esc(ev.subtitle)}</p>` : ''}
            ${ev.subtitle2 ? `<p class="ga-home__desc">${esc(ev.subtitle2).replace(/\n/g, '<br>')}</p>` : ''}
            <a class="ga-home__more" href="event">Lihat detail &amp; syarat ketentuan <i class="bi bi-arrow-right"></i></a>
            <div class="ga-home__action">${ev.giveaway
              ? `<button class="ga-home__btn" type="button" data-open="${ev.id}">Daftar Giveaway</button>`
              : '<p class="ga-home__closed">Pendaftaran sudah ditutup.</p>'}</div>
          </div>
          <div class="ga-home__wheel">
            <div class="ga-home__canvas"><span class="ga-home__pointer"></span><canvas width="720" height="720"></canvas></div>
            <p class="ga-home__count"></p>
            <div class="ga-home__video"></div>
          </div>
        </div>`).join('')}
      ${others.length ? `
        <div class="home-events__head">
          <h2>Event Terbaru</h2>
          <a href="event" class="home-events__all">Lihat semua event <i class="bi bi-arrow-right"></i></a>
        </div>
        <div class="home-events__grid">${others.slice(0, 3).map(cardHtml).join('')}</div>` : ''}`;

    withGa.forEach(({ ev, entries }) => {
      boards[ev.id] = { wheel: GiveawayWheel(document.querySelector(`#ga-${ev.id} canvas`)), entries, title: ev.title };
      render(ev.id);
    });
    box.querySelectorAll('[data-open]').forEach(btn => btn.addEventListener('click', () => openForm(btn.dataset.open)));
    box.style.display = '';

    const ids = Object.keys(boards);
    if (ids.length) {
      const { data: vids } = await db.from('site_content').select('id,image_url').in('id', ids.map(id => 'gavideo_' + id));
      (vids || []).forEach(v => {
        const slot = document.querySelector(`#ga-${v.id.slice(8)} .ga-home__video`);
        if (slot && v.image_url) slot.innerHTML = `<p class="ga-home__vlabel"><i class="bi bi-camera-video me-1"></i> Video hasil undian</p><video src="${esc(v.image_url)}" controls playsinline preload="metadata"></video>`;
      });
      setInterval(refresh, 20000);
    }
  }

  // Popup form daftar (native <dialog>: Esc & klik di luar menutup).
  function buildDialog() {
    document.body.insertAdjacentHTML('beforeend', `
      <dialog class="ga-dialog" aria-labelledby="ga-dialog-title">
        <form class="ga-home__form" novalidate>
          <button class="ga-dialog__close" type="button" aria-label="Tutup">&times;</button>
          <span class="ga-home__kicker"><i class="bi bi-gift me-1"></i> Daftar Giveaway</span>
          <h3 id="ga-dialog-title"></h3>
          <p class="ga-home__note">Semua data wajib diisi <span class="ga-home__req">*</span></p>
          <label class="ga-home__label"><span>Nama lengkap <span class="ga-home__req">*</span></span>
            <input class="form-control" name="name" placeholder="Nama lengkap" maxlength="80" autocomplete="name" required></label>
          <label class="ga-home__label"><span>No. telp / WhatsApp <span class="ga-home__req">*</span></span>
            <input class="form-control" name="phone" type="tel" placeholder="08..." autocomplete="tel" inputmode="tel" required></label>
          <label class="ga-home__label"><span>No. Struk <span class="ga-home__req">*</span></span>
            <input class="form-control" name="receipt" placeholder="Nomor di struk belanja Teiko" maxlength="40" autocapitalize="characters" required></label>
          <label class="ga-home__label"><span>Instagram <span class="ga-home__req">*</span></span>
            <div class="input-group"><span class="input-group-text">@</span><input class="form-control" name="instagram" placeholder="username" maxlength="31" autocapitalize="off" required></div></label>
          <button class="ga-home__btn" type="submit">Kirim</button>
          <div class="ga-home__msg" role="status"></div>
        </form>
      </dialog>`);
    dialog = document.body.lastElementChild;
    dialog.querySelector('.ga-dialog__close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.querySelector('form').addEventListener('submit', join);
  }

  function openForm(id) {
    if (!dialog) buildDialog();
    currentEvent = id;
    const f = dialog.querySelector('form');
    f.reset();
    f.querySelector('.ga-home__msg').textContent = '';
    dialog.querySelector('#ga-dialog-title').textContent = boards[id].title || 'Giveaway Teiko';
    dialog.showModal();
    f.elements.namedItem('name').focus();
  }

  function render(id) {
    // Pemenang tidak diumumkan di website: roda publik selalu berisi semua peserta.
    const g = boards[id], row = document.getElementById(`ga-${id}`);
    row.querySelector('.ga-home__count').textContent = `${g.entries.length} peserta`;
    g.wheel.set(g.entries.map(e => ({ name: e.name, is_winner: false })), true);
  }

  async function refresh() {
    for (const id of Object.keys(boards)) {
      if (boards[id].wheel.spinning) continue;
      const { data, error } = await db.rpc('giveaway_public', { p_event: id });
      if (error || !data) continue;
      boards[id].entries = data;
      render(id);
    }
  }

  async function join(e) {
    e.preventDefault();
    const f = e.target, msg = f.querySelector('.ga-home__msg'), btn = f.querySelector('button[type=submit]');
    const eventId = currentEvent;
    const val = n => f.elements.namedItem(n).value;
    const name = val('name').trim().replace(/\s+/g, ' ');
    const phone = val('phone').replace(/[\s.()-]/g, '');
    const receipt = val('receipt').trim().replace(/\s+/g, '').toUpperCase();
    const instagram = val('instagram').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
    const fail = t => { msg.className = 'ga-home__msg is-error'; msg.textContent = t; };
    if (name.length < 2) return fail('Isi nama lengkap.');
    if (!/^\+?[0-9]{8,15}$/.test(phone)) return fail('No. telp harus 8-15 angka.');
    if (!/^[A-Za-z0-9/._-]{3,40}$/.test(receipt)) return fail('Isi No. Struk sesuai yang tertera di struk.');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return fail('Username Instagram tidak valid.');
    btn.disabled = true; msg.textContent = '';
    const { error } = await db.from('giveaway_entries').insert({ event_id: eventId, name, phone, instagram, receipt });
    btn.disabled = false;
    if (error) {
      if (error.code === '23505') return fail(/receipt/.test(error.message) ? 'No. Struk ini sudah dipakai.' : 'Nomor telp ini sudah terdaftar di giveaway ini.');
      if (error.code === '42501') return fail('Pendaftaran giveaway sudah ditutup.');
      return fail('Gagal mendaftar, coba lagi.');
    }
    dialog.close();
    const action = document.querySelector(`#ga-${eventId} .ga-home__action`);
    if (action) action.innerHTML = `<div class="ga-home__done"><i class="bi bi-check-circle me-1"></i> ${esc(name)}, kamu sudah terdaftar! Namamu sudah masuk roda undian.</div>`;
    await refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

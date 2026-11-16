// Event Terbaru + Giveaway di homepage (index.html). Giveaway: form daftar selama pendaftaran dibuka,
// roda undian berisi nama peserta (dari giveaway_public(), tanpa no. telp) dan daftar pemenang.
// Spin hanya dari admin.html; di website roda cuma ditonton (update tiap 20 detik).
(function () {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const boards = {}; // eventId -> { wheel, entries }

  async function init() {
    const wrap = document.getElementById('giveaway-section');
    if (!wrap || typeof sb === 'undefined') return;
    const { data: events, error } = await sb.from('site_content')
      .select('id,title,subtitle,subtitle2,image_url,giveaway,is_active')
      .ilike('id', 'event_%').eq('is_active', true);
    if (error || !events) return;
    events.sort((a, b) => b.id.localeCompare(a.id));
    renderEvents(events);
    for (const ev of events) {
      const { data: entries } = await sb.rpc('giveaway_public', { p_event: ev.id });
      if (!ev.giveaway && !(entries && entries.length)) continue;
      wrap.insertAdjacentHTML('beforeend', `
        <div class="ga-home" id="ga-${ev.id}">
          <div class="ga-home__info">
            <span class="ga-home__kicker"><i class="bi bi-gift me-1"></i> Giveaway</span>
            <h2>${esc(ev.title || 'Giveaway Teiko')}</h2>
            ${ev.subtitle ? `<p class="ga-home__period"><i class="bi bi-calendar-event me-1"></i>${esc(ev.subtitle)}</p>` : ''}
            ${ev.subtitle2 ? `<p class="ga-home__desc">${esc(ev.subtitle2).replace(/\n/g, '<br>')}</p>` : ''}
            ${ev.giveaway ? `
            <form class="ga-home__form" novalidate>
              <p class="ga-home__note">Semua data wajib diisi <span class="ga-home__req">*</span></p>
              <label class="ga-home__label"><span>Nama lengkap <span class="ga-home__req">*</span></span>
                <input class="form-control" name="name" placeholder="Nama lengkap" maxlength="80" autocomplete="name" required></label>
              <label class="ga-home__label"><span>No. telp / WhatsApp <span class="ga-home__req">*</span></span>
                <input class="form-control" name="phone" type="tel" placeholder="08..." autocomplete="tel" inputmode="tel" required></label>
              <label class="ga-home__label"><span>Instagram <span class="ga-home__req">*</span></span>
                <div class="input-group"><span class="input-group-text">@</span><input class="form-control" name="instagram" placeholder="username" maxlength="31" autocapitalize="off" required></div></label>
              <button class="ga-home__btn" type="submit">Daftar Giveaway</button>
              <div class="ga-home__msg" role="status"></div>
            </form>` : '<p class="ga-home__closed">Pendaftaran sudah ditutup.</p>'}
          </div>
          <div class="ga-home__wheel">
            <div class="ga-home__canvas"><span class="ga-home__pointer"></span><canvas width="720" height="720"></canvas></div>
            <p class="ga-home__count"></p>
            <div class="ga-home__winners"></div>
            <div class="ga-home__video"></div>
          </div>
        </div>`);
      const box = document.getElementById(`ga-${ev.id}`);
      boards[ev.id] = { wheel: GiveawayWheel(box.querySelector('canvas')), entries: entries || [] };
      box.querySelector('form')?.addEventListener('submit', e => join(e, ev.id));
      render(ev.id);
    }
    const ids = Object.keys(boards);
    if (ids.length) {
      const { data: vids } = await sb.from('site_content').select('id,image_url').in('id', ids.map(id => 'gavideo_' + id));
      (vids || []).forEach(v => {
        const box = document.querySelector(`#ga-${v.id.slice(8)} .ga-home__video`);
        if (box && v.image_url) box.innerHTML = `<p class="ga-home__vlabel"><i class="bi bi-camera-video me-1"></i> Video hasil undian</p><video src="${esc(v.image_url)}" controls playsinline preload="metadata"></video>`;
      });
    }
    if (ids.length) {
      wrap.style.display = '';
      setInterval(refresh, 20000);
    }
  }

  // Ringkasan "Event Terbaru" di homepage: maksimal 3 kartu, klik menuju halaman Event.
  function renderEvents(events) {
    const box = document.getElementById('home-events');
    const list = events.filter(ev => ev.image_url).slice(0, 3);
    if (!box || !list.length) return;
    box.innerHTML = `
      <div class="home-events__head">
        <h2>Event Terbaru</h2>
        <a href="event" class="home-events__all">Lihat semua event <i class="bi bi-arrow-right"></i></a>
      </div>
      <div class="home-events__grid">
        ${list.map(ev => `
          <div class="home-events__card">
            <a href="event"><img src="${esc(ev.image_url)}" alt="${esc(ev.title || 'Event Teiko')}" loading="lazy"></a>
            <div class="home-events__body">
              ${ev.giveaway ? '<span class="home-events__tag"><i class="bi bi-gift me-1"></i>Giveaway</span>' : ''}
              <h3><a href="event">${esc(ev.title || 'Event Teiko')}</a></h3>
              ${ev.subtitle ? `<p><i class="bi bi-clock me-1"></i>${esc(ev.subtitle)}</p>` : ''}
              ${ev.giveaway ? `<a class="home-events__join" href="#ga-${ev.id}">Ikut Giveaway <i class="bi bi-arrow-down"></i></a>` : ''}
            </div>
          </div>`).join('')}
      </div>`;
    box.style.display = '';
  }

  function render(id) {
    const g = boards[id], box = document.getElementById(`ga-${id}`);
    const winners = g.entries.filter(e => e.is_winner);
    box.querySelector('.ga-home__count').textContent = `${g.entries.length} peserta`;
    box.querySelector('.ga-home__winners').innerHTML = winners.length ? `
      <div class="ga-home__winbox">
        <div class="ga-home__winlabel"><i class="bi bi-trophy me-1"></i> Pemenang</div>
        ${winners.map(w => `<div class="ga-home__winner">${esc(w.name)} <span>@${esc(w.instagram)}</span></div>`).join('')}
      </div>` : '';
    g.wheel.set(g.entries, true);
  }

  async function refresh() {
    for (const id of Object.keys(boards)) {
      if (boards[id].wheel.spinning) continue;
      const { data, error } = await sb.rpc('giveaway_public', { p_event: id });
      if (error || !data) continue;
      boards[id].entries = data;
      render(id);
    }
  }

  async function join(e, eventId) {
    e.preventDefault();
    const f = e.target, msg = f.querySelector('.ga-home__msg'), btn = f.querySelector('button');
    const val = n => f.elements.namedItem(n).value;
    const name = val('name').trim().replace(/\s+/g, ' ');
    const phone = val('phone').replace(/[\s.()-]/g, '');
    const instagram = val('instagram').trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
    const fail = t => { msg.className = 'ga-home__msg is-error'; msg.textContent = t; };
    if (name.length < 2) return fail('Isi nama lengkap.');
    if (!/^\+?[0-9]{8,15}$/.test(phone)) return fail('No. telp harus 8-15 angka.');
    if (!/^[A-Za-z0-9._]{1,30}$/.test(instagram)) return fail('Username Instagram tidak valid.');
    btn.disabled = true; msg.textContent = '';
    const { error } = await sb.from('giveaway_entries').insert({ event_id: eventId, name, phone, instagram });
    btn.disabled = false;
    if (error) {
      if (error.code === '23505') return fail('Nomor ini sudah terdaftar di giveaway ini.');
      if (error.code === '42501') return fail('Pendaftaran giveaway sudah ditutup.');
      return fail('Gagal mendaftar, coba lagi.');
    }
    f.outerHTML = '<div class="ga-home__done"><i class="bi bi-check-circle me-1"></i> Kamu sudah terdaftar! Pantau Instagram Teiko untuk pengumuman pemenang.</div>';
    refresh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

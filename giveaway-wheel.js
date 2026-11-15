// Roda undian giveaway. Dipakai admin.html (panel peserta) dan event.html (tampilan publik).
// Pemenang dipilih acak (crypto) dulu, lalu roda diputar supaya berhenti tepat di potongannya.
window.GiveawayWheel = function (canvas) {
  const TAU = 2 * Math.PI;
  const COLORS = ['#006241', '#D4E9E2', '#1E3932', '#F2F0EB', '#00754A', '#CBA258'];
  const DARK_TEXT = ['#D4E9E2', '#F2F0EB', '#CBA258'];
  const ctx = canvas.getContext('2d');
  let angle = 0, spinning = false, pool = [];

  function draw() {
    const R = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!pool.length) {
      ctx.fillStyle = '#F2F0EB'; ctx.beginPath(); ctx.arc(R, R, R - 4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#777'; ctx.font = '600 30px Figtree, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Belum ada peserta', R, R + 10);
      return;
    }
    const seg = TAU / pool.length;
    ctx.save(); ctx.translate(R, R); ctx.rotate(angle);
    pool.forEach((e, i) => {
      let color = COLORS[i % COLORS.length];
      if (i === pool.length - 1 && i > 0 && i % COLORS.length === 0) color = COLORS[2]; // beda dari potongan pertama
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, R - 4, i * seg, (i + 1) * seg); ctx.closePath(); ctx.fill();
      if (pool.length > 80) return; // terlalu rapat untuk label
      ctx.save(); ctx.rotate(i * seg + seg / 2);
      ctx.fillStyle = DARK_TEXT.includes(color) ? '#1E3932' : '#fff';
      ctx.font = `600 ${pool.length > 40 ? 16 : pool.length > 20 ? 22 : 28}px Figtree, sans-serif`;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(e.name.length > 16 ? e.name.slice(0, 15) + '…' : e.name, R - 24, 0);
      ctx.restore();
    });
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(R, R, 46, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#1E3932'; ctx.lineWidth = 6; ctx.stroke();
  }

  return {
    get spinning() { return spinning; },
    // entries: [{name, is_winner, ...}]; pemenang tidak ikut roda.
    set(entries, resetAngle) {
      pool = entries.filter(e => !e.is_winner);
      if (resetAngle) angle = 0;
      if (!spinning) draw();
    },
    spin(onDone) {
      if (spinning || !pool.length) return false;
      const r = new Uint32Array(1); crypto.getRandomValues(r);
      const win = r[0] % pool.length, seg = TAU / pool.length;
      // Penunjuk di atas (-90 derajat): tengah potongan pemenang harus berhenti di sana.
      const target = ((-Math.PI / 2 - (win * seg + seg / 2)) % TAU + TAU) % TAU;
      const start = angle, end = start + 6 * TAU + ((target - (start % TAU)) % TAU + TAU) % TAU;
      const winner = pool[win], dur = 5200, t0 = performance.now();
      spinning = true;
      const step = now => {
        const t = Math.min(1, (now - t0) / dur);
        angle = start + (end - start) * (1 - Math.pow(1 - t, 4));
        draw();
        if (t < 1) return requestAnimationFrame(step);
        spinning = false;
        onDone(winner);
      };
      requestAnimationFrame(step);
      return true;
    }
  };
};

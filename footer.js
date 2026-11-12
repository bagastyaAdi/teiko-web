// Pasang footer.html ke placeholder yang ada di tiap halaman.
const footerPlaceholder = document.getElementById('footer-placeholder');

fetch('/footer.html', { cache: 'no-cache' })
  .then(res => res.text())
  .then(data => {
    footerPlaceholder.innerHTML = data;
  })
  .catch(err => console.error('Gagal memuat footer:', err));

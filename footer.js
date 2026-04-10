const footerPlaceholder = document.getElementById('footer-placeholder');

fetch('/footer.html')
  .then(res => res.text())
  .then(data => {
    footerPlaceholder.innerHTML = data;
  })
  .catch(err => console.error('Gagal memuat footer:', err));

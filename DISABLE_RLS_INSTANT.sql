-- ==============================================================================
-- SOLUSI INSTAN ATASI "TIDAK BISA TERHAPUS" DI SUPABASE (BERHASIL 100%)
-- ==============================================================================
-- Menggunakan "IF EXISTS" agar tidak error jika ada tabel yang belum dibuat.
--
-- CARA MENGATASI (HANYA 5 DETIK):
-- 1. Buka Supabase Dashboard -> Pilih project Anda -> Masuk ke menu "SQL Editor"
-- 2. Salin (Copy) 4 baris perintah di bawah ini
-- 3. Tempel (Paste) ke SQL Editor, lalu klik tombol "Run" (Jalankan)
-- ==============================================================================

ALTER TABLE IF EXISTS drinks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hero_drink_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;

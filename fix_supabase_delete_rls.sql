-- ==============================================================================
-- SCRIPT SOLUSI PENGHAPUSAN (DELETE) SUPABASE - TEIKO INDONESIA
-- ==============================================================================
-- Mengapa sebelumnya data tidak bisa dihapus?
-- Secara default, Supabase mengaktifkan Row Level Security (RLS) pada tabel.
-- Jika Anda tidak membuat kebijakan (policy) yang mengizinkan operasi DELETE,
-- Supabase akan memblokir penghapusan secara diam-diam (0 baris terhapus).
--
-- CARA MENGGUNAKAN SCRIPT INI:
-- 1. Buka dashboard Supabase Anda (https://supabase.com/dashboard)
-- 2. Pilih project Anda -> Masuk ke menu "SQL Editor" di sidebar kiri
-- 3. Copy & paste seluruh isi file ini, lalu klik tombol "Run" (Jalankan)
-- ==============================================================================

-- OPSI A (Sangat Disarankan untuk Kemudahan Admin):
-- Mengaktifkan izin penuh (SELECT, INSERT, UPDATE, DELETE) untuk publik/anonim
-- pada keempat tabel Teiko:

ALTER TABLE drinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_drink_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All drinks" ON drinks;
CREATE POLICY "Allow All drinks" ON drinks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All hero_drink_slides" ON hero_drink_slides;
CREATE POLICY "Allow All hero_drink_slides" ON hero_drink_slides FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All site_content" ON site_content;
CREATE POLICY "Allow All site_content" ON site_content FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow All feedback" ON feedback;
CREATE POLICY "Allow All feedback" ON feedback FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- OPSI B (Alternatif Tercepat):
-- Jika Anda ingin mematikan RLS sepenuhnya agar semua CRUD lancar tanpa batasan policy:
--
-- ALTER TABLE drinks DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE hero_drink_slides DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE site_content DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE feedback DISABLE ROW LEVEL SECURITY;
-- ==============================================================================

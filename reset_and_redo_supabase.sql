-- ==============================================================================
-- MASTER RESET, REDO & RLS POLICY SUPABASE — TEIKO INDONESIA
-- ==============================================================================
-- Gunakan script ini jika Anda salah memasukkan data atau ingin mereset ulang
-- seluruh tabel, struktur kolom, serta kebijakan (Policy) di Supabase dari awal (Redo).
--
-- CARA MENGGUNAKAN:
-- 1. Buka Supabase Dashboard Anda -> Pilih Project -> Masuk ke "SQL Editor"
-- 2. Salin (Copy) seluruh isi file ini, tempel (Paste) ke SQL Editor, klik "Run" (Jalankan)
-- ==============================================================================

-- 1. HAPUS KEBIJAKAN (POLICY) LAMA YANG SALAH / MEMBLOKIR DELETE
DROP POLICY IF EXISTS "Allow All drinks" ON drinks;
DROP POLICY IF EXISTS "Allow All hero_drink_slides" ON hero_drink_slides;
DROP POLICY IF EXISTS "Allow All site_content" ON site_content;
DROP POLICY IF EXISTS "Allow All feedback" ON feedback;

-- 2. HAPUS TABEL LAMA BESERTA DATA YANG SALAH (REDO / CLEAN SLATE)
DROP TABLE IF EXISTS drinks CASCADE;
DROP TABLE IF EXISTS hero_drink_slides CASCADE;
DROP TABLE IF EXISTS site_content CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;

-- 3. BUAT ULANG TABEL DENGAN STRUKTUR (SCHEMA) TERLENGKAP TEIKO
CREATE TABLE site_content (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  subtitle2 TEXT,
  image_url TEXT,
  emoji TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  button_text TEXT,  -- Dipakai untuk menentukan layout PRIMARY pada event
  button_url TEXT,   -- Dipakai untuk Link Tujuan Klik
  tnc TEXT,          -- Dipakai untuk Syarat & Ketentuan Event
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hero_drink_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE drinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT DEFAULT 'Tea',
  oz_size TEXT DEFAULT '16 oz',
  price TEXT DEFAULT 'Rp 15.000',
  image_url TEXT,
  detail TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NONAKTIFKAN RLS AGAR HAPUS (DELETE), EDIT, DAN TAMBAH 100% BERHASIL TANPA BLOKIR
ALTER TABLE IF EXISTS site_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hero_drink_slides DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS drinks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS feedback DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. PENGISIAN DATA BAWAAN (SEEDING) RESMI TEIKO
-- ==============================================================================

-- A. Insert 4 FAQ Bawaan Resmi Teiko
INSERT INTO site_content (id, title, subtitle, is_active) VALUES
(
  'faq_1_kemitraan',
  'Apakah Teiko membuka kemitraan atau franchise?',
  'Saat ini kami belum membuka sistem kemitraan (franchise). Seluruh outlet Teiko dikelola langsung oleh tim manajemen pusat untuk menjaga kualitas dan cita rasa terbaik. Informasi resmi mengenai pembukaan kemitraan di masa mendatang hanya akan diumumkan melalui kanal resmi Teiko.',
  TRUE
),
(
  'faq_2_karir',
  'Bagaimana cara melamar pekerjaan atau bergabung dengan tim Teiko?',
  'Kami terus mencari talenta dan pekerja bersemangat untuk bergabung bersama keluarga besar Teiko! Kamu bisa mengirimkan CV dan surat lamaran terbaru kamu melalui email resmi kami ke support@teiko.co.id dengan subjek lamaran kerja.',
  TRUE
),
(
  'faq_3_kualitas',
  'Apakah seluruh minuman di Teiko menggunakan bahan segar dan berkualitas?',
  'Tentu! Setiap minuman teh, kopi, dan krim spesial di Teiko diracik menggunakan daun teh asli pilihan, biji kopi premium, serta susu dan bahan alami berkualitas tinggi.',
  TRUE
),
(
  'faq_4_email',
  'Bagaimana cara menghubungi kontak resmi email Teiko sesuai keperluan?',
  'Kami memiliki 3 alamat email resmi sesuai fungsinya:\n• info@teiko.co.id : untuk informasi Broadcast & Media.\n• support@teiko.co.id : untuk proses Hiring, lowongan kerja & pengiriman CV.\n• sales@teiko.co.id : untuk komunikasi dengan distributor/reseller terkait stok, harga, atau promo.',
  TRUE
);

-- B. Insert 8 Menu Minuman Resmi Teiko
INSERT INTO drinks (name, category, price, oz_size, image_url, detail, is_active) VALUES
('Es Coklat Teiko Special', 'Chocolate', 'Rp 15.000', '16 oz', './asset/hero3.png', 'Paduan coklat pekat khas Belgia dengan susu segar dan krim manis yang lumer di mulut.', TRUE),
('Brown Sugar Boba Milk', 'Milk', 'Rp 18.000', '16 oz', './asset/hero1.webp', 'Susu segar lembut dipadukan dengan gula aren asli khas Teiko serta kenyalnya boba premium.', TRUE),
('Matcha Oat Latte', 'Tea', 'Rp 20.000', '16 oz', './asset/dummy_matcha.png', 'Teh hijau Uji Matcha pilihan bergaya Jepang dengan susu oat yang gurih dan menyehatkan.', TRUE),
('Belgian Choco Cream', 'Chocolate', 'Rp 18.000', '16 oz', './asset/dummy_choco.png', 'Cokelat Belgia autentik dengan lapisan krim kental bertekstur lembut dan rasa cokelat pekat.', TRUE),
('Teiko Coffee Cream Special', 'Coffee', 'Rp 18.000', '16 oz', './asset/dummy_coffee.png', 'Kopi espresso house-blend Teiko berpadu dengan susu kental lembut dan taburan bubuk kopi.', TRUE),
('Taro Creamy Milk', 'Milk', 'Rp 16.000', '16 oz', './asset/dummy_taro.png', 'Aroma talas (taro) yang harum manis menyatu sempurna dengan susu krim kental khas Teiko.', TRUE),
('Jasmine Green Tea Original', 'Tea', 'Rp 10.000', '22 oz', './asset/hero1.webp', 'Teh melati seduh segar alami yang harum, ringan, dan sangat menyegarkan untuk setiap waktu.', TRUE),
('Caramel Macchiato Teiko', 'Coffee', 'Rp 20.000', '16 oz', './asset/dummy_coffee.png', 'Espresso kaya rasa dengan sirup karamel legit dan lapisan busa susu yang lembut.', TRUE);

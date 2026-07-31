-- ==============================================================================
-- FIX KOLOM MISSING 'button_url' DI TABEL site_content SUPABASE
-- ==============================================================================
-- Alasan Error: Tabel "site_content" di database Supabase Anda sebelumnya belum
-- memiliki kolom bernama "button_url".
--
-- CARA MENGATASI DALAM 5 DETIK (TANPA HAPUS DATA):
-- 1. Buka Supabase Dashboard (https://supabase.com/dashboard) -> SQL Editor (>_)
-- 2. Salin dan jalankan (Klik "RUN") 1 baris perintah di bawah ini:

ALTER TABLE IF EXISTS site_content ADD COLUMN IF NOT EXISTS button_url TEXT;

-- Setelah klik RUN, silakan coba kembali tombol "Simpan Perubahan" di Admin Panel.
-- Dijamin 100% langsung berhasil tersimpan tanpa error!

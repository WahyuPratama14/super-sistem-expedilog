# 📦 ExpediLog — Sistem Manajemen Logistik & Ekspedisi Terpadu

[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-success?style=for-the-badge&logo=github)](https://pages.github.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg?style=for-the-badge)](LICENSE)

**ExpediLog** adalah platform manajemen logistik dan ekspedisi modern yang dirancang untuk pendataan resi pengiriman, monitoring paket *outstanding* (SLA keterlambatan), analisis performa kurir dan retur klien, siaran pesan WhatsApp massal (*Blast WA*), serta kolaborasi operasional gudang secara terpadu.

Aplikasi ini dapat dijalankan langsung di browser (**100% Client-Side / Standalone**) menggunakan **LocalStorage & SafeStorage Engine**, atau di-hosting secara gratis dan instan melalui **GitHub Pages**.

---

## 🚀 Fitur Unggulan Sistem

### 1. 📊 Dashboard Operasional & Analitik
* **Ringkasan Real-Time**: KPI Total Resi, Delivered, Tingkat Retur (%), dan Paket OS Belum Terproses.
* **Grafik Interaktif**: Visualisasi tren pengiriman (*Delivered vs Return*) dengan filter periode (Minggu, Bulan, Tahun).
* **Evaluasi Kurir & Klien**: Peringkat 5 klien dengan retur tertinggi dan kurir dengan rasio kendala terbanyak.

### 2. 📋 Tabel Pendataan & Pelacakan Resi
* **Pencarian Multi-Kriteria**: Cari berdasarkan No AWB, Nama Pengirim, Penerima, Kurir, atau Deskripsi Barang.
* **Filter Popover Modern**: Filter cerdas untuk status paket (*On Process*, *Delivered*, *Delivery Return*, dll.), kurir, dan SLA RTN.
* **Manajemen Resi**: Input resi baru, edit data, dan konfirmasi hapus dengan modal responsif.

### 3. ⏳ Monitoring Paket Outstanding (SLA RTN >= 5 Hari)
* **SLA Threshold Detection**: Otomatis mendeteksi paket non-delivered yang tertahan dengan durasi SLA >= 5 hari.
* **Pill Filter SLA**: Filter cepat per durasi hari keterlambatan (*Semua SLA, SLA 10+, SLA 9, dst.*).
* **Export Excel Terformat (.xlsx)**: Unduh laporan *outstanding* lengkap dengan format tabel siap cetak dan warna header emerald.

### 4. 👥 Manajemen Data Klien
* Direktori pelanggan dan pengirim setia dengan rekapitulasi total paket yang dikirimkan serta tanggal pengiriman terakhir.

### 5. 💬 WhatsApp Blast Massal
* **Template Dinamis**: Personalisasi pesan otomatis menggunakan tag `{nama}`, `{resi}`, `{ongkir}`, `{kurir}`, dan `{barang}`.
* **Live WhatsApp Preview**: Simulasi tampilan bubble chat WhatsApp secara langsung sebelum pengiriman.
* **Multi-Format Import**: Mendukung import data nomor customer via file Excel (`.xlsx`, `.xls`, `.csv`) atau langsung dari daftar resi aktif.

### 6. 📁 File Manager / Cloud Drive
* Penyimpanan dan pengarsipan berkas dokumen logistik (Surat Jalan, Manifest, SOP, Analisis Bulanan).
* Fitur *Quick Preview*, filter kategori, dan pencarian berkas.

### 7. 📝 Notepad Tim Operasional
* Papan catatan kolaborasi untuk staf operasional gudang dan admin logistik.
* Dilengkapi penanda tingkat urgensi (*Penting*, *Biasa*, *Info*) serta pencatatan nama penulis dan tanggal.

### 8. 🌐 Portal Terpadu & Keamanan
* Akses cepat 1-klik ke sistem pendukung eksternal (Cek Ongkir, Web Tracking Kurir, Portal Internal).
* Sistem otentikasi login aman dengan proteksi sesi.

---

## 🔑 Kredensial Login Default

Saat pertama kali membuka aplikasi:
* **Username**: `Pratama`
* **Password**: `Pratama_123`
* *Tersedia juga tombol pintas instan **🚀 Masuk ke Sistem (1-Klik)** di halaman login.*

---

## 🌐 Cara Publikasi ke GitHub Pages (Hanya 2 Menit)

Anda tidak perlu menginstall Git di komputer. Cukup ikuti langkah berikut langsung dari browser:

### Langkah 1: Buat Repositori Baru di GitHub
1. Buka [GitHub.com](https://github.com/) dan pastikan sudah login.
2. Klik tombol **`New`** (atau buka langsung [github.com/new](https://github.com/new)).
3. Beri nama repositori: `expedilog` (atau nama lain yang Anda inginkan).
4. Pilih opsi **Public**, lalu klik **`Create repository`**.

### Langkah 2: Upload File Proyek
1. Di halaman repositori baru yang baru saja dibuat, klik link bertuliskan **`uploading an existing file`**.
2. Tarik dan lepas (*Drag & Drop*) semua file dari folder komputer Anda (`expedilog-app`):
   * **`index.html`**
   * **`README.md`**
   * **`.nojekyll`**
   * **`LICENSE`**
3. Di bagian bawah, klik tombol hijau **`Commit changes`**.

### Langkah 3: Aktifkan GitHub Pages (1-Klik)
1. Di repositori Anda, klik menu tab **`Settings`** (ikon roda gigi di bagian atas).
2. Di sidebar sebelah kiri, klik menu **`Pages`**.
3. Pada bagian **Build and deployment**:
   * **Source**: Pilih `Deploy from a branch`
   * **Branch**: Pilih `main` (atau `master`), folder tetap `/ (root)`
   * Klik tombol **`Save`**.
4. Tunggu sekitar 30–60 detik, lalu refresh halaman Settings > Pages tersebut.
5. URL web app Anda yang sudah online akan muncul di bagian atas bertuliskan:  
   👉 **`https://<username-anda>.github.io/expedilog/`**

Aplikasi ExpediLog Anda kini sudah **100% online di internet, cepat, aman (HTTPS), dan dapat diakses dari HP, Tablet, maupun Laptop**!

---

## 💻 Menjalankan Secara Offline

Cukup klik dua kali (*double click*) file `index.html` di komputer Anda, dan aplikasi akan langsung terbuka di browser (Chrome, Edge, Firefox, Brave) tanpa perlu koneksi internet.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).

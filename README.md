# 🚀 Dynamic QR Code Manager & Generator

Aplikasi web modern berbasis **Next.js 16** dan **React 19** untuk membuat, mengelola, dan melacak QR Code dinamis serta short link URL dengan antarmuka yang elegan dan responsif.

---

## ✨ Fitur Utama

- 🔗 **Dynamic QR Codes & Short Links**: Buat short URL dan QR code yang dapat dialihkan (`/r/[id]`) ke tautan tujuan kapan saja tanpa perlu mengganti gambar QR code fisik.
- 🎨 **Kustomisasi Desain QR**: 
  - Pilihan warna kustom (warna foreground & background).
  - Berbagai preset warna modern.
  - Pengaturan level *Error Correction* (L, M, Q, H).
- 📊 **Pelacakan & Analytics Sederhana**: Menghitung jumlah scan / klik secara real-time pada setiap tautan.
- 💾 **Export Fleksibel**: Unduh QR Code dalam format **PNG** (berbagai resolusi) atau **SVG** (vector).
- 🛠️ **Manajemen Lengkap (CRUD)**:
  - Cari & filter daftar QR code.
  - Edit URL tujuan secara instan.
  - Hapus dan salin tautan dengan satu klik.
- ⚡ **UI/UX Modern & Responsif**: Dibangun dengan Tailwind CSS v4 dan komponen UI yang bersih, minimalis, dan responsif di semua perangkat.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **Library UI**: [React 19](https://react.dev/), [Base UI](https://base-ui.com/), [Lucide React Icons](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **QR Engine**: [`qrcode`](https://www.npmjs.com/package/qrcode)

---

## 🚀 Memulai (Getting Started)

### 1. Clone Repository
```bash
git clone https://github.com/USERNAME/belajar-next.git
cd belajar-next
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Jalankan Development Server
```bash
npm run dev
```

Buka browser dan akses [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

---

## 📁 Struktur Direktori

```text
src/
├── app/
│   ├── api/
│   │   └── qrcodes/        # Endpoint API CRUD untuk data QR Code
│   ├── r/
│   │   └── [id]/           # Dynamic redirect handler & scan counter
│   ├── data.json           # Penyimpanan data lokal
│   ├── globals.css         # Styling global Tailwind CSS
│   ├── layout.js           # Root layout aplikasi
│   ├── page.js             # Halaman utama
│   └── QRCodeGen.js        # Komponen utama generator & manajemen QR
├── components/
│   └── ui/                 # Komponen UI (Card, Button, Dialog, Table, dll.)
└── lib/
    ├── qr-client.js        # Helper generator & downloader QR Code
    └── utils.js            # Utility functions (cn / clsx)
```

---

## 📜 Scripts yang Tersedia

| Command | Keterangan |
|---|---|
| `npm run dev` | Menjalankan server development dengan Turbopack |
| `npm run build` | Melakukan build aplikasi untuk production |
| `npm run start` | Menjalankan build production secara lokal |
| `npm run lint` | Memeriksa format dan kesalahan kode dengan ESLint |

---

## 📄 Lisensi
Project ini dibuat untuk tujuan pembelajaran dan pengembangan pribadi.

# 🎯 Mini Project API – Event Management System

Backend API untuk aplikasi manajemen event berbasis peran (**Customer** & **Organizer**), dengan fitur:
- Autentikasi & otorisasi
- Sistem referral & hadiah
- Dashboard event untuk organizer
- Transaksi & kupon hadiah

Dibangun menggunakan: **Node.js**, **Express**, **Prisma**, dan **PostgreSQL**.

---

## ✨ Fitur Utama

### 1. Autentikasi & Otorisasi
- Register & login menggunakan JWT
- Middleware berdasarkan role (`customer`, `organizer`)
- Validasi input menggunakan Zod

### 2. Sistem Referral & Profil
- Kode referral saat registrasi
- Poin & hadiah berdasarkan referral
- Informasi profil pengguna lengkap

### 3. Manajemen Event (Organizer)
- Buat, edit, dan hapus event
- Lihat daftar peserta
- Kirim notifikasi pemenang kupon

### 4. Transaksi & Kupon Hadiah
- Customer dapat bergabung pada event
- Kupon diundi secara acak
- Cron job otomatis untuk mengecek kupon yang kadaluarsa

---

## ⚙️ Teknologi

- **Node.js** + **Express** — Backend & routing
- **PostgreSQL** + **Prisma** — Database & ORM
- **Zod** — Validasi input
- **JWT** — Autentikasi token
- **Cron** — Penjadwalan otomatis

---

## 📁 Struktur Folder

```
src/
├── controllers     # Handler untuk setiap fitur
├── middlewares     # Middleware otentikasi & error handler
├── routes          # Modular route
├── services        # Logika bisnis & akses database
├── utils           # Helper dan cron job
└── app.ts          # Inisialisasi express app
```

---

## 🚀 Cara Menjalankan Secara Lokal

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/adlinoor/miniproject-api.git
cd miniproject-api
npm install
```

### 2. Buat File `.env`
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
JWT_SECRET="your_secret_key"
PORT=8080
```

### 3. Migrasi & Seeding Database
```bash
npx prisma migrate dev
npx prisma db seed
```

### 4. Jalankan Server Development
```bash
npm run dev
```

### 5. Jalankan untuk Deployment (Vercel / Serverless)
Untuk deployment ke platform seperti **Vercel**, gunakan:

```bash
npm start
```

Script `start` akan menjalankan:
```bash
npm run build && node dist/app.js
```

Pastikan hasil build tersedia:
```bash
npm run build
```

> **Catatan untuk Vercel**:
> - **Build Command**: `npm run build`
> - **Start Command**: `npm start`
> - Entry point: `dist/app.js` (hasil build dari `src/app.ts`)

---

## 🧪 Testing

Unit test tersedia untuk fitur utama:
```bash
npm run test
```

---

## 👤 Kontributor

- [@adlinoor](https://github.com/adlinoor)
- [@rianmumtaz12](https://github.com/rianmumtaz12)

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah MIT License.

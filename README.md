# 🎯 Mini Project API – Event Management System

Backend API untuk aplikasi manajemen event berbasis peran (Customer & Organizer), dilengkapi fitur:
- Autentikasi & otorisasi
- Sistem referral & hadiah
- Dashboard event untuk organizer
- Transaksi & kupon hadiah

Dibangun menggunakan: **Node.js**, **Express**, **Prisma**, dan **PostgreSQL**.

---

## ✨ Fitur Utama

### 1. Autentikasi & Otorisasi
- Register & login menggunakan JWT
- Middleware berdasarkan role (`CUSTOMER`, `ORGANIZER`)
- Validasi form dengan Zod

### 2. Sistem Referral & Profil
- Kode referral saat registrasi
- Poin & hadiah berdasarkan referral
- Informasi profil pengguna lengkap

### 3. Manajemen Event (Organizer)
- Buat, edit, dan hapus event
- Lihat daftar peserta
- Kirim notifikasi pemenang kupon

### 4. Transaksi & Kupon Hadiah
- Customer dapat join event
- Kupon diundi secara acak
- Cron job untuk cek kupon kadaluarsa

---

## ⚙️ Teknologi

- **Node.js** + **Express** — Server & routing
- **PostgreSQL** + **Prisma** — Database & ORM
- **Zod** — Validasi input
- **JWT** — Autentikasi token
- **Cron** — Jadwal otomatis (kupon)

---

## 📁 Struktur Folder

```
src/
├── controllers     # Handler untuk setiap fitur
├── middlewares     # Autentikasi, error handling
├── routes          # Routing modular
├── services        # Logika bisnis
├── utils           # Helper + cron job
└── app.ts          # Setup express app
```

---

## 🚀 Cara Menjalankan Lokal

1. **Clone & install dependencies**
   ```bash
   git clone https://github.com/adlinoor/miniproject-api.git
   cd miniproject-api
   npm install
   ```

2. **Buat file `.env`**
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE"
   JWT_SECRET="your_secret_key"
   PORT=8080
   ```

3. **Migrasi & seeding database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Jalankan server**
   ```bash
   npm run dev
   ```

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

# ARevents – Backend API (Mini Project)

Repository ini merupakan backend dari aplikasi ARevents, platform manajemen event berbasis web yang mendukung role **Customer** dan **Organizer**. Dibangun menggunakan **Node.js, Express.js, TypeScript**, dan **Prisma** dengan database **PostgreSQL**.

---

## 📦 Tech Stack

- **Node.js + Express.js** – Backend API
- **TypeScript** – Tipe statis & keamanan kode
- **Prisma ORM** – Query builder & schema modeling
- **PostgreSQL** – Database relasional
- **JWT + cookies-next** – Autentikasi dan otorisasi berbasis token
- **Multer + Cloudinary** – Upload gambar (profil & event)
- **Zod** – Validasi request body

---

## 🔐 Fitur API

### 🟩 Authentication & User System
- Register & login (dengan referral opsional)
- Role-based login: `CUSTOMER` atau `ORGANIZER`
- Logout & JWT cookie handling
- Update profile dengan upload foto
- Middleware otorisasi (auth, role check)

### 🟦 Event & Transaksi
- CRUD event (hanya organizer)
- Upload gambar event (multi-image)
- Transaksi: beli tiket, upload bukti pembayaran
- Referral & poin reward
- Review & rating event
- Validasi status transaksi (expired, done, rejected)

---

## 📁 Struktur Folder

```
src/
├── controllers/       # Logika utama tiap endpoint
├── middlewares/       # Middleware otorisasi, error, upload
├── routes/            # Routing per fitur (auth, user, event, dll.)
├── services/          # Abstraksi business logic
├── utils/             # Helper dan konfigurasi cloudinary, zod, dll.
├── prisma/            # Schema dan seed
└── app.ts             # Entry point aplikasi
```

---

## ⚙️ Setup Project

```bash
# 1. Clone repo
git clone https://github.com/adlinoor/miniproject-api.git
cd miniproject-api
npm install

# 2. Buat file environment
cp .env.example .env

# 3. Setup database
npx prisma migrate dev --name init
npx prisma db seed

# 4. Jalankan server dev
npm run dev
```

---

## 🌐 Endpoint Utama

| Method | Endpoint                     | Deskripsi                         |
|--------|------------------------------|-----------------------------------|
| POST   | `/auth/register`             | Register user                     |
| POST   | `/auth/login`                | Login user                        |
| POST   | `/auth/logout`               | Logout user                       |
| GET    | `/users/me`                  | Get current user (cookie-based)  |
| PUT    | `/users/profile`             | Update profil + upload foto      |
| GET    | `/events`                    | List event (public)              |
| GET    | `/events/:id`                | Detail event                      |
| POST   | `/transactions`              | Buat transaksi event             |
| POST   | `/reviews`                   | Tambah review                    |

---

## 🧪 Testing Manual

- Cek endpoint via Postman (dengan cookie)
- Gunakan frontend [miniproject-web](https://github.com/adlinoor/miniproject-web)
- Validasi file upload, role restriction, poin, dan referral

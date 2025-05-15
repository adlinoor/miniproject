# 🎉 Mini Project API

Repository ini merupakan backend API untuk aplikasi manajemen event berbasis role (Customer & Organizer), dilengkapi dengan sistem autentikasi, referral, dashboard event, transaksi, dan notifikasi. Dibangun dengan **Node.js**, **Express**, **Prisma**, dan **PostgreSQL**.

## 🚀 Fitur Utama

### 🔐 1. User Authentication & Authorization
- Register & login (JWT-based)
- Middleware otorisasi berdasarkan peran (`CUSTOMER`, `ORGANIZER`)
- Validasi input menggunakan Zod

### 🎁 2. Referral System & User Profile
- Referral code unik pada saat registrasi
- Poin referral & hadiah
- Halaman profil dengan informasi user, referral, dan hadiah

### 📅 3. Event Management Dashboard
- Organizer dapat membuat, mengedit, dan menghapus event
- Customer dapat melihat detail event dan bergabung
- Fitur daftar peserta dan notifikasi pemenang kupon

### 💸 4. Transaction & Coupon System
- Simulasi transaksi event (join event)
- Kupon acak sebagai hadiah
- Sistem kadaluarsa kupon otomatis (cron job)

## 🛠️ Tech Stack

| Teknologi     | Deskripsi                     |
|---------------|-------------------------------|
| Node.js       | Runtime JavaScript            |
| Express.js    | Framework HTTP ringan         |
| Prisma ORM    | Database ORM untuk PostgreSQL |
| PostgreSQL    | Database relasional           |
| Zod           | Validasi input                |
| JWT           | Autentikasi berbasis token    |
| Cron          | Jadwal otomatis sistem kupon  |

## 📁 Struktur Folder

📦src
┣ 📂controllers # Handler endpoint
┣ 📂middlewares # Middleware auth & error
┣ 📂routes # Routing untuk fitur
┣ 📂services # Logika bisnis & database access
┣ 📂utils # Helper & cron job
┗ 📜app.ts # Konfigurasi express

bash
Copy
Edit

## ⚙️ Cara Menjalankan Lokal

### 1. Clone repo ini
```bash
git clone https://github.com/adlinoor/miniproject-api.git
cd miniproject-api
2. Install dependencies
bash
Copy
Edit
npm install
3. Setup environment
Buat file .env dan isi seperti berikut:

ini
Copy
Edit
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your_jwt_secret"
PORT=8080
4. Migrasi dan seeding database
bash
Copy
Edit
npx prisma migrate dev
npx prisma db seed
5. Jalankan server
bash
Copy
Edit
npm run dev
Server akan berjalan di http://localhost:8080.

🧪 Testing
Unit test tersedia untuk fitur utama:

bash
Copy
Edit
npm run test
👨‍💻 Kontributor
@adlinoor @rianmumtaz12

📄 Lisensi
Proyek ini menggunakan lisensi MIT.

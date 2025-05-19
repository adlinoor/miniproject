# ARevents Backend (Express + Prisma)

This is the backend of the ARevents application — provides API for event management, transactions, promotions, referrals, and role-based user access.

## 🚀 Key Features

- JWT Auth with Role (Customer / Organizer)
- Referral System (Code, Points, Coupons)
- Event CRUD with Cloudinary Image Upload
- Event Voucher Management
- Checkout + Payment Proof + Auto Status Update
- Review & Rating System
- Organizer Dashboard: Statistics, Attendees List
- Scheduled Jobs: Auto Expiry for Transactions & Points
- Full Route Protection & Input Validation

## 🧪 Tech Stack

- Express.js
- PostgreSQL + Prisma ORM
- Cloudinary (Image Upload)
- Nodemailer (Email Notifications)
- Zod (Validation)
- Multer (File Upload)
- JWT (Authentication)
- Cron (Task Scheduler)

## ⚙️ Local Setup

```bash
npm install
npm run dev
```

Create `.env`:

```env
DATABASE_URL=postgres://...
SECRET_KEY=your_jwt_secret
FRONTEND_URL=http://localhost:3000

CLOUDINARY_NAME=...
CLOUDINARY_KEY=...
CLOUDINARY_SECRET=...

NODEMAILER_USER=...
NODEMAILER_PASS=...
```

## 🌐 Deployment

Backend is live at:  
👉 https://miniproject-api-five.vercel.app

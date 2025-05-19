# Mini Project API

This is the backend API for a minimal event management platform. It supports event creation, transactions, authentication, referral system, profile editing, and dashboard analytics.

## 🧩 Tech Stack

- Node.js
- Express.js
- PostgreSQL + Prisma ORM
- Zod (Validation)
- Multer + Cloudinary (File upload)
- JWT Authentication
- Nodemailer (Email Notification)

## 🚀 Features

### Feature 1 – Event System
- Event discovery, detail view, creation, and promotion (voucher system)
- Ticket transaction system with 6 statuses and countdown logic
- Upload payment proof (with 2h countdown)
- Auto status transition (expire after 2h, cancel after 3d)
- Points & seat rollback if transaction canceled/expired
- Post-event rating & review

### Feature 2 – User System
- Register / Login with role: `customer` or `organizer`
- Referral code system (generate & use)
- Referral rewards (points + coupon)
- Profile edit (with optional image upload)
- Protected role-based routes

### Feature 3 – Organizer Dashboard
- View and manage events, transactions, and attendees
- Statistics by year/month/day
- Admin approval for payments
- Email notification on transaction approval/rejection

## 🛠 How to Run

```bash
# 1. Clone & Install
git clone https://github.com/adlinoor/miniproject-api.git
cd miniproject-api
npm install

# 2. Setup Environment
cp .env.example .env
# Fill in database URL, JWT secret, Cloudinary keys, etc.

# 3. Prisma
npx prisma migrate dev
npx prisma generate

# 4. Start Server
npm run dev
```

## 🧪 Testing

Unit tests are implemented using Jest and Supertest.

```bash
npm run test
```

## 📬 API Docs

Use Postman collection in `docs/` folder or access Swagger (if available).

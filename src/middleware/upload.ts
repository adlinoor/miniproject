import multer from "multer";
import path from "path";
import { Request } from "express";
import { UserPayload } from "../interfaces/user.interface";

// Gunakan storage disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/payment_proofs/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Filter jenis file yang diizinkan
const fileFilter = (
  req: Request, // Ini akan membaca tipe Request yang sudah di-extend via custom.d.ts
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedExtensions = /jpeg|jpg|png|pdf/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );
  const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];
  const mimetype = allowedMimes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG images or PDF files are allowed"));
  }
};

// Inisialisasi multer dengan limit file
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});

export default upload;

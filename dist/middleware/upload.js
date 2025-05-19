"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Gunakan storage disk
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads/payment_proofs/");
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
// Filter jenis file yang diizinkan
const fileFilter = (req, // Ini akan membaca tipe Request yang sudah di-extend via custom.d.ts
file, cb) => {
    const allowedExtensions = /jpeg|jpg|png|pdf/;
    const extname = allowedExtensions.test(path_1.default.extname(file.originalname).toLowerCase());
    const allowedMimes = ["image/jpeg", "image/png", "application/pdf"];
    const mimetype = allowedMimes.includes(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    }
    else {
        cb(new Error("Only JPEG, PNG images or PDF files are allowed"));
    }
};
// Inisialisasi multer dengan limit file
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
});
exports.default = upload;

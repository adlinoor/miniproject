"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIRECT_URL = exports.DATABASE_URL = exports.FRONTEND_URL = exports.NODEMAILER_PASS = exports.NODEMAILER_USER = exports.CLOUDINARY_API_SECRET = exports.CLOUDINARY_API_KEY = exports.CLOUDINARY_CLOUD_NAME = exports.SECRET_KEY = exports.PORT = void 0;
require("dotenv/config");
_a = process.env, exports.PORT = _a.PORT, exports.SECRET_KEY = _a.SECRET_KEY, exports.CLOUDINARY_CLOUD_NAME = _a.CLOUDINARY_CLOUD_NAME, exports.CLOUDINARY_API_KEY = _a.CLOUDINARY_API_KEY, exports.CLOUDINARY_API_SECRET = _a.CLOUDINARY_API_SECRET, exports.NODEMAILER_USER = _a.NODEMAILER_USER, exports.NODEMAILER_PASS = _a.NODEMAILER_PASS, exports.FRONTEND_URL = _a.FRONTEND_URL, exports.DATABASE_URL = _a.DATABASE_URL, exports.DIRECT_URL = _a.DIRECT_URL;

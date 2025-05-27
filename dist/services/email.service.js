"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = exports.sendEmail = exports.mailer = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
exports.mailer = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS,
    },
});
const sendEmail = (to, subject, html) => __awaiter(void 0, void 0, void 0, function* () {
    yield exports.mailer.sendMail({
        from: `"ARevents" <${process.env.NODEMAILER_USER}>`,
        to,
        subject,
        html,
    });
});
exports.sendEmail = sendEmail;
// Kirim email verifikasi
const sendVerificationEmail = (to) => __awaiter(void 0, void 0, void 0, function* () {
    const filePath = path_1.default.resolve("src/templates/register-template.hbs");
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error("Email template tidak ditemukan di path: " + filePath);
    }
    const source = fs_1.default.readFileSync(filePath, "utf-8").toString();
    const template = handlebars_1.default.compile(source);
    const verify_url = `${process.env.FRONTEND_URL}/verify-email/${encodeURIComponent(to)}`;
    const html = template({ email: to, verify_url });
    yield (0, exports.sendEmail)(to, "ARevents: Verify Your Account", html);
});
exports.sendVerificationEmail = sendVerificationEmail;

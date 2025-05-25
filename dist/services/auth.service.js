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
exports.LoginService = exports.RegisterService = void 0;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const point_service_1 = require("./point.service");
// Service untuk registrasi pengguna
const RegisterService = (param) => __awaiter(void 0, void 0, void 0, function* () {
    if (!Object.values(client_1.Role).includes(param.role)) {
        throw new Error(`Invalid role. Must be one of: ${Object.values(client_1.Role).join(", ")}`);
    }
    const isExist = yield prisma_1.default.user.findFirst({
        where: { email: param.email },
    });
    if (isExist)
        throw new Error("Email already registered");
    const hashedPassword = yield bcrypt_1.default.hash(param.password, 10);
    const referralCode = `REF-${Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase()}`;
    let referredByUser = null;
    if (param.referralCode) {
        referredByUser = yield prisma_1.default.user.findUnique({
            where: { referralCode: param.referralCode.toUpperCase() },
        });
        if (!referredByUser)
            throw new Error("Invalid referral code");
    }
    // ⬇️ TRANSACTION FINAL
    const user = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // 1. Buat user baru
        const newUser = yield tx.user.create({
            data: {
                email: param.email,
                password: hashedPassword,
                first_name: param.first_name,
                last_name: param.last_name,
                role: param.role,
                isVerified: false,
                referralCode,
                referredBy: (referredByUser === null || referredByUser === void 0 ? void 0 : referredByUser.referralCode) || null,
                userPoints: 0, // default
            },
        });
        // 2. Jika pakai referral, reward ke referrer & new user (via addPoints)
        if (referredByUser) {
            // a. Referrer (yang kasih kode) dapat 10.000 point
            yield (0, point_service_1.addPoints)(tx, referredByUser.id, 10000);
            // b. User baru juga dapat 10.000 point
            yield (0, point_service_1.addPoints)(tx, newUser.id, 10000);
            // c. Buat coupon ke user baru (opsional, bisa dihapus kalau tidak pakai kupon)
            yield tx.coupon.create({
                data: {
                    userId: newUser.id,
                    code: `COUP-${Math.random()
                        .toString(36)
                        .substring(2, 8)
                        .toUpperCase()}`,
                    discount: 10000,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
                },
            });
        }
        return newUser;
    }));
    return user;
});
exports.RegisterService = RegisterService;
// Service untuk login pengguna
const LoginService = (param) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findFirst({
        where: { email: param.email },
    });
    if (!user)
        throw new Error("Email not registered");
    const isPasswordValid = yield bcrypt_1.default.compare(param.password, user.password);
    if (!isPasswordValid)
        throw new Error("Incorrect password");
    const token = jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
    }, process.env.SECRET_KEY, { expiresIn: "1h" });
    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            referralCode: user.referralCode,
            isVerified: user.isVerified,
            userPoints: user.userPoints,
        },
    };
});
exports.LoginService = LoginService;

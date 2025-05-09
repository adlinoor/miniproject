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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../lib/prisma"));
const RegisterService = (param) => __awaiter(void 0, void 0, void 0, function* () {
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
    const user = yield prisma_1.default.user.create({
        data: {
            email: param.email,
            password: hashedPassword,
            first_name: param.first_name,
            last_name: param.last_name,
            role: param.role,
            isVerified: false,
            referralCode,
        },
    });
    return user;
});
exports.RegisterService = RegisterService;
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
            isVerified: user.isVerified,
        },
    };
});
exports.LoginService = LoginService;

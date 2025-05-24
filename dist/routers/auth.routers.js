"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const validator_middleware_1 = require("../middleware/validator.middleware");
const auth_controller_2 = require("../controllers/auth.controller");
const router = express_1.default.Router();
// Register
router.post("/register", (0, validator_middleware_1.validateRequest)(auth_controller_2.registerSchema), auth_controller_1.register);
// Login
router.post("/login", (0, validator_middleware_1.validateRequest)(auth_controller_2.loginSchema), auth_controller_1.login);
router.post("/forgot-password", auth_controller_1.forgotPassword);
router.post("/reset-password/:token", auth_controller_1.resetPassword);
exports.default = router;

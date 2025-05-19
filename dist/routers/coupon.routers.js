"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const coupon_controller_1 = require("../controllers/coupon.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
router.post("/redeem", auth_middleware_1.authenticate, (0, auth_middleware_1.authorizeRoles)(client_1.Role.CUSTOMER), coupon_controller_1.redeemCoupon);
exports.default = router;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const promotion_controller_1 = require("../controllers/promotion.controller");
const router = (0, express_1.Router)();
router.post("/apply", promotion_controller_1.applyVoucherHandler);
exports.default = router;

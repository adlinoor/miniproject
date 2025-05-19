import { Router } from "express";
import { redeemCoupon } from "../controllers/coupon.controller";
import { authenticate, authorizeRoles } from "../middleware/auth.middleware";
import { Role } from "@prisma/client";

const router = Router();

router.post(
  "/redeem",
  authenticate,
  authorizeRoles(Role.CUSTOMER),
  redeemCoupon
);

export default router;

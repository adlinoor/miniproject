import { Router } from "express";
import { applyVoucherHandler } from "../controllers/promotion.controller";

const router = Router();

router.post("/apply", applyVoucherHandler);

export default router;

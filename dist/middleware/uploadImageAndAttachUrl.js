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
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImageAndAttachUrl = void 0;
const cloudinary_service_1 = require("../services/cloudinary.service");
const uploadImageAndAttachUrl = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.file) {
            const imageUrl = yield (0, cloudinary_service_1.uploadToCloudinary)(req.file);
            req.body.imageUrl = imageUrl;
        }
        next();
    }
    catch (error) {
        console.error("Image upload failed:", error);
        return res.status(500).json({ message: "Image upload failed" });
    }
});
exports.uploadImageAndAttachUrl = uploadImageAndAttachUrl;

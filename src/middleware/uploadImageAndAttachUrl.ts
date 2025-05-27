import { Request, Response, NextFunction } from "express";
import { uploadToCloudinary } from "../services/cloudinary.service";

export const uploadImageAndAttachUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    req.body.imageUrls = [];
    // multi image support
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = await uploadToCloudinary(file);
        req.body.imageUrls.push(imageUrl);
      }
    } else if (req.file) {
      // fallback single image
      const imageUrl = await uploadToCloudinary(req.file);
      req.body.imageUrls = [imageUrl];
    }
    next();
  } catch (error) {
    console.error("Image upload failed:", error);
    return res.status(500).json({ message: "Image upload failed" });
  }
};

import { Request, Response, NextFunction } from "express";
import { uploadToCloudinary } from "../services/cloudinary.service";

export const uploadImageAndAttachUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.file) {
      const imageUrl = await uploadToCloudinary(req.file);
      req.body.imageUrl = imageUrl;
    }
    next();
  } catch (error) {
    console.error("Image upload failed:", error);
    return res.status(500).json({ message: "Image upload failed" });
  }
};

import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadToCloudinary = (
  file: Express.Multer.File
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "payment_proofs" },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result?.secure_url) {
          resolve(result.secure_url);
        } else {
          reject(new Error("No secure_url returned by Cloudinary"));
        }
      }
    );

    Readable.from(file.buffer).pipe(stream);
  });
};

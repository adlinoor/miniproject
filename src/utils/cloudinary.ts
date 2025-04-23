import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import * as streamifier from "streamifier";
import { CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET } from "../config";

cloudinary.config({
  cloud_name: CLOUDINARY_NAME || "",
  api_key: CLOUDINARY_KEY || "",
  api_secret: CLOUDINARY_SECRET || "",
});

export function cloudinaryUpload(
  file: Express.Multer.File
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream((err, res) => {
      if (err) return reject(err);
      if (!res) return reject(new Error("Upload response is undefined"));
      resolve(res);
    });
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
}

export async function cloudinaryRemove(secure_url: string) {
  const publicId = secure_url.split("/").pop()?.split(".")[0];
  if (!publicId) throw new Error("Invalid URL");
  return await cloudinary.uploader.destroy(publicId);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary_1.v2.uploader.upload_stream({ folder: "payment_proofs" }, (error, result) => {
            if (error) {
                return reject(error);
            }
            if (result === null || result === void 0 ? void 0 : result.secure_url) {
                resolve(result.secure_url);
            }
            else {
                reject(new Error("No secure_url returned by Cloudinary"));
            }
        });
        stream_1.Readable.from(file.buffer).pipe(stream);
    });
};
exports.uploadToCloudinary = uploadToCloudinary;

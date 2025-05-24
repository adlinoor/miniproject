"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploader = void 0;
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
exports.uploader = {
    upload_stream_to_cloudinary: (fileBuffer) => {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream((error, result) => {
                if (error)
                    return reject(error);
                resolve(result);
            });
            stream_1.Readable.from(fileBuffer).pipe(uploadStream);
        });
    },
};

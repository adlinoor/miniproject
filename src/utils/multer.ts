import multer from "multer";
import path from "path";

export function Multer(
  type: "memoryStorage" | "diskStorage" = "memoryStorage",
  filePrefix = "file-",
  folderName = "uploads"
) {
  const defaultDir = path.join(__dirname, "../../public");
  const storage =
    type === "memoryStorage"
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, path.join(defaultDir, folderName));
          },
          filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const baseName = path.basename(file.originalname, ext);
            cb(null, `${filePrefix}${Date.now()}-${baseName}${ext}`);
          },
        });

  return multer({
    storage,
    limits: { fileSize: 1024 * 1024 }, // 1MB limit
  });
}

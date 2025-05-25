"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
exports.Multer = Multer;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
function Multer(type = "memoryStorage", filePrefix = "file-", folderName = "uploads") {
    const defaultDir = path_1.default.join(__dirname, "../../public");
    const storage = type === "memoryStorage"
        ? multer_1.default.memoryStorage()
        : multer_1.default.diskStorage({
            destination: (req, file, cb) => {
                cb(null, path_1.default.join(defaultDir, folderName));
            },
            filename: (req, file, cb) => {
                const ext = path_1.default.extname(file.originalname);
                const baseName = path_1.default.basename(file.originalname, ext);
                cb(null, `${filePrefix}${Date.now()}-${baseName}${ext}`);
            },
        });
    return (0, multer_1.default)({
        storage,
        limits: { fileSize: 1024 * 1024 }, // 1MB limit
    });
}
exports.upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });

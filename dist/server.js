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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const PORT = process.env.PORT || 8080;
const ENV = process.env.NODE_ENV || "development";
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
        // Connect to database
        try {
            yield prisma_1.default.$connect();
            console.log("✅ Database connected");
        }
        catch (error) {
            console.error("❌ Database connection error:", error);
            process.exit(1);
        }
        // 🕒 Jalankan scheduled cron job (poin, kupon, transaksi expired)
        console.log("⏱️  Starting scheduled cron jobs...");
        // (cron import cukup, jadwal langsung aktif)
        // Create HTTP server
        const server = http_1.default.createServer(app_1.default);
        // Start listening
        server.listen(PORT, () => {
            const url = `http://localhost:${PORT}`;
            console.log(`🚀 Server is running at ${url}`);
            console.log(`🌐 Environment: ${ENV}`);
        });
        // Graceful shutdown
        const shutdown = () => __awaiter(this, void 0, void 0, function* () {
            console.log("\n🛑 Shutting down server...");
            yield prisma_1.default.$disconnect();
            server.close(() => {
                console.log("✅ Server closed");
                process.exit(0);
            });
        });
        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    });
}
startServer().catch(console.error);

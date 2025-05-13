import http from "http";
import app from "./app";
import prisma from "./lib/prisma";
import cron from "./utils/cron"; // ✅ pastikan cron diimport & dijalankan

const PORT = process.env.PORT || 8080;

async function startServer() {
  // Connect to database
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ Database connection error:", error);
    process.exit(1);
  }

  // 🕒 Jalankan scheduled cron job (poin, kupon, transaksi expired)
  console.log("⏱️  Starting scheduled cron jobs...");
  // (cron import cukup, jadwal langsung aktif)

  // Create HTTP server
  const server = http.createServer(app);

  // Start listening
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log("\n🛑 Shutting down server...");
    await prisma.$disconnect();
    server.close(() => {
      console.log("✅ Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

startServer().catch(console.error);

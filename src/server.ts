import app from "./app";
import dotenv from "dotenv";
import prisma from "./lib/prisma";

// Load env vars
dotenv.config();

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`🔄 Received ${signal}, shutting down gracefully...`);
  await prisma.$disconnect();
  server.close(() => {
    process.exit();
  });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

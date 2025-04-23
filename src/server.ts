import app from "./index";
import { prisma } from "./index";
import { checkExpiredTransactions } from "./services/transaction.service";
import cron from "node-cron";

const PORT = process.env.PORT || 8080;

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Schedule cron job to check expired transactions every hour
cron.schedule("0 * * * *", async () => {
  console.log("Checking for expired transactions...");
  await checkExpiredTransactions();
});

// Handle shutdown gracefully
process.on("SIGTERM", async () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Process terminated");
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received. Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Process terminated");
  });
});

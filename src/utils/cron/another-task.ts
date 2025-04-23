import scheduleTask from "./user-verify-task";

async function cleanUpLogs() {
  console.log("Cleaning up logs...");
  // Add log cleanup logic here
}

// Schedule the log cleanup task to run every day at 1 AM
scheduleTask("Log Cleanup", "0 1 * * *", cleanUpLogs);

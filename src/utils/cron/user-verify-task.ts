import cron from "node-cron";

/**
 * Schedules a task to run at a specified cron schedule.
 * @param taskName - A descriptive name for the task (used in logs).
 * @param cronExpression - The cron expression defining the schedule.
 * @param taskCallback - The function containing the task logic to execute.
 */
function scheduleTask(
  taskName: string,
  cronExpression: string,
  taskCallback: () => Promise<void>
) {
  cron.schedule(cronExpression, async () => {
    console.log(`[${taskName}] Task started at ${new Date().toISOString()}`);
    try {
      await taskCallback();
      console.log(`[${taskName}] Task completed successfully.`);
    } catch (error) {
      console.error(`[${taskName}] Task failed:`, error);
    }
  });
}

export default scheduleTask;

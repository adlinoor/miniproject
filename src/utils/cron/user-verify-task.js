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
const node_cron_1 = __importDefault(require("node-cron"));
/**
 * Schedules a task to run at a specified cron schedule.
 * @param taskName - A descriptive name for the task (used in logs).
 * @param cronExpression - The cron expression defining the schedule.
 * @param taskCallback - The function containing the task logic to execute.
 */
function scheduleTask(taskName, cronExpression, taskCallback) {
    node_cron_1.default.schedule(cronExpression, () => __awaiter(this, void 0, void 0, function* () {
        console.log(`[${taskName}] Task started at ${new Date().toISOString()}`);
        try {
            yield taskCallback();
            console.log(`[${taskName}] Task completed successfully.`);
        }
        catch (error) {
            console.error(`[${taskName}] Task failed:`, error);
        }
    }));
}
exports.default = scheduleTask;

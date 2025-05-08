"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const serverless_http_1 = __importDefault(require("serverless-http"));
const isVercel = !!process.env.VERCEL;
if (!isVercel) {
    const PORT = process.env.PORT || 8080;
    app_1.app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}
module.exports = (0, serverless_http_1.default)(app_1.app);

import { app } from "./app";
import serverless from "serverless-http";

const isVercel = !!process.env.VERCEL;

if (!isVercel) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

module.exports = serverless(app);

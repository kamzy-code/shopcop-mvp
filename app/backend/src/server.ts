import { env } from "@config/env.js";
import app from "app.js";
import logger from "@utils/logger.js";

const PORT = env.PORT;

async function startServer() {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`, {
      service: "server",
      action: "START_SERVER",
      timestamp: new Date().toISOString(),
    });
  });
}

startServer();

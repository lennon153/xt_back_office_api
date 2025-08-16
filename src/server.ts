import dotenv from "dotenv";
import app from "./app";
import { log } from "./utils/logger";

dotenv.config();

const PORT = process.env.PORT || 4000;

function main() {
  app.listen(PORT, () => {
    log.info(`🚀 Server running on http://localhost:${PORT}`);
  });
}

main();

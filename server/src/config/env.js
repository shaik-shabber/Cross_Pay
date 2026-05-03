import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config({ debug: false });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV = {
  PORT: Number(process.env.PORT) || 5000,
  MONGO_URI: process.env.MONGO_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "crosspay-local-secret",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  DATA_FILE:
    process.env.DATA_FILE ||
    path.join(__dirname, "..", "..", "data", "demo-db.json"),
};

export default ENV;
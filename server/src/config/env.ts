import dotenv from "dotenv";
import path from "path";
import fs from "fs";

const NODE_ENV = process.env.NODE_ENV || "development";
const root = process.cwd();

// Load env-specific file first — it takes priority over base .env
// (dotenv doesn't override vars already in process.env)
const specificFile = path.resolve(root, `.env.${NODE_ENV}`);
if (fs.existsSync(specificFile)) {
    dotenv.config({ path: specificFile });
}

// Load base .env — fills in any vars not already set
dotenv.config({ path: path.resolve(root, ".env") });

export const IS_PROD = NODE_ENV === "production";
export const IS_DEV = NODE_ENV === "development";

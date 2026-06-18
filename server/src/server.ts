import express from "express";
import db from "./config/db";
import router from "./routes";
import dotenv from "dotenv";
import colors from "colors";

dotenv.config();

const app = express();
app.use(express.json());

const ALLOWED_ORIGINS = new Set([
    process.env.CLIENT_URL || "http://localhost:5173",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]);

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    } else if (!origin) {
        res.header("Access-Control-Allow-Origin", "*");
    }
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.use("/api", router);

export const connectDB = async () => {
    try {
        await db.authenticate();
        await db.sync({ alter: true });
        console.log(colors.cyan.bold("Database connection successful"));
    } catch (error) {
        console.log(colors.red.bold("Database connection error:"));
        console.log(error);
        process.exit(1);
    }
};

export default app;

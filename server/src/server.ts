import "./config/env"; // must be first — loads layered dotenv before any other import
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import db from "./config/db";
import router from "./routes";
import colors from "colors";

const app = express();

// Security headers (CSP/HSTS/etc.). API-only, so the default is fine.
app.use(helmet());

// Body parsing: only the photo-scan endpoint needs the big 15mb base64 payload;
// every other route is capped at 2mb to shrink the DoS surface. The scan parser is
// mounted first for its path, so the global 2mb parser skips an already-parsed body.
app.use("/api/forms/ai/scan", express.json({ limit: "15mb" }));
app.use(express.json({ limit: "2mb" }));

// Global rate limit — blunt protection against abuse/scraping across the API.
app.use(rateLimit({
    windowMs: 60_000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
}));

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

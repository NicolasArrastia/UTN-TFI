import express from "express";
import healthRouter from "./routes/health.routes.ts";

const app = express();

app.disable("x-powered-by");
app.use(express.json());

app.use("/api/health", healthRouter);

export default app;

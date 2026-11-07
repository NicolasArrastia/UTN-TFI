import express from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.ts";
import authRouter from "./routes/auth.routes.ts";
import healthRouter from "./routes/health.routes.ts";
import productRouter from "./routes/product.routes.ts";

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

import cors from "cors";
import express from "express";
import { env } from "./config/env.ts";
import {
  errorHandler,
  notFoundHandler,
} from "./middlewares/error.middleware.ts";
import authRouter from "./routes/auth.routes.ts";
import categoryRouter from "./routes/category.routes.ts";
import healthRouter from "./routes/health.routes.ts";
import productRouter from "./routes/product.routes.ts";
import tagRouter from "./routes/tag.routes.ts";
import userRouter from "./routes/user.routes.ts";

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.clientOrigins }));
app.use(express.json({ limit: "10kb" }));

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/tags", tagRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

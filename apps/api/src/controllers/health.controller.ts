import type { Request, Response } from "express";

export const healthCheck = (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    message: "Server is running",
  });
};

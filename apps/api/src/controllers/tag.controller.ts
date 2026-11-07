import type { NextFunction, Request, Response } from "express";
import { tagService } from "../services/tag.service.ts";

export const listTags = (
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    res.status(200).json({ tags: tagService.list() });
  } catch (error) {
    next(error);
  }
};

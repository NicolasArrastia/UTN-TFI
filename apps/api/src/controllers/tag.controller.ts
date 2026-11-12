import type { NextFunction, Request, Response } from "express";
import { tagService } from "../services/tag.service.ts";
import { parseIdParam } from "../validators/tag.validator.ts";

export const listTags = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const role = req.auth?.role ?? "employee";
    const tags = await tagService.list(req.query, role);

    res.status(200).json({ tags });
  } catch (error) {
    next(error);
  }
};

export const getTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const tag = await tagService.getById(id);

    res.status(200).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const createTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tag = await tagService.create(req.body);

    res.status(201).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const updateTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const tag = await tagService.update(id, req.body);

    res.status(200).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = parseIdParam(req.params.id);
    const tag = await tagService.remove(id);

    res.status(200).json({ tag });
  } catch (error) {
    next(error);
  }
};

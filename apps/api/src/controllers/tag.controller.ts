import type { NextFunction, Request, Response } from "express";
import { tagService } from "../services/tag.service.ts";
import { parseIdParam } from "../validators/tag.validator.ts";

export const listTags = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const role = req.auth?.role ?? "employee";
    res.status(200).json({ tags: tagService.list(req.query, role) });
  } catch (error) {
    next(error);
  }
};

export const getTag = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const id = parseIdParam(req.params.id);
    const tag = tagService.getById(id);

    res.status(200).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const createTag = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const tag = tagService.create(req.body);

    res.status(201).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const updateTag = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const id = parseIdParam(req.params.id);
    const tag = tagService.update(id, req.body);

    res.status(200).json({ tag });
  } catch (error) {
    next(error);
  }
};

export const deleteTag = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const id = parseIdParam(req.params.id);
    const tag = tagService.remove(id);

    res.status(200).json({ tag });
  } catch (error) {
    next(error);
  }
};

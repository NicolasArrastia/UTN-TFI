import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/app-error.ts";
import { statsService } from "../services/stats.service.ts";
import { STATS_PERIODS, type StatsPeriod } from "../types/stats.types.ts";

const parsePeriod = (value: unknown): StatsPeriod => {
  if (value === undefined) {
    return "month";
  }

  if (
    typeof value === "string" &&
    STATS_PERIODS.includes(value as StatsPeriod)
  ) {
    return value as StatsPeriod;
  }

  throw new AppError(
    `El período debe ser uno de: ${STATS_PERIODS.join(", ")}.`,
    400,
    "VALIDATION_ERROR",
  );
};

export const getOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    res.status(200).json({ overview: await statsService.getOverview() });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const period = parsePeriod(req.query.period);
    res.status(200).json({ stats: await statsService.getStats(period) });
  } catch (error) {
    next(error);
  }
};

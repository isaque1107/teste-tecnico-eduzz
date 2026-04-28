import { Response } from "express";
import { AppError } from "./errors";
import { HttpResponse } from "./http.types";
import { logger } from "./logger";

export abstract class BaseController {
  protected send<T>(res: Response, status: number, data: T): void {
    const body: HttpResponse<T> = {
      success: true,
      status,
      data,
    };

    res.status(status).json(body);
  }

  protected sendError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
      const body: HttpResponse = {
        success: false,
        status: error.statusCode,
        error: {
          code: error.code ?? "E_ERROR",
          message: error.message,
        },
      };

      res.status(error.statusCode).json(body);
      return;
    }

    logger.error("Erro inesperado", {
      message: (error as Error)?.message,
      stack: (error as Error)?.stack,
    });

    const body: HttpResponse = {
      success: false,
      status: 500,
      error: {
        code: "E_INTERNAL_ERROR",
        message: "Erro interno do servidor",
      },
    };

    res.status(500).json(body);
  }
}
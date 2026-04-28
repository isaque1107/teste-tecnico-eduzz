export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(recurso: string) {
    super(`${recurso} não encontrado`, 404, "E_NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "E_VALIDATION");
  }
}

export class BusinessError extends AppError {
  constructor(message: string) {
    super(message, 422, "E_BUSINESS");
  }
}
// Standard application error carrying an HTTP status code
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'Nicht authentifiziert'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Keine Berechtigung für diese Aktion'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Ressource nicht gefunden'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }
}

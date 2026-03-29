class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.isClientError = statusCode >= 400 && statusCode < 500;
    if (typeof Error.captureStackTrace === "function") {
      try {
        Error.captureStackTrace(this, APIError);
      } catch {
        /* ignore — can fail in rare static-init / subclass edge cases */
      }
    }
  }
}

module.exports = APIError;
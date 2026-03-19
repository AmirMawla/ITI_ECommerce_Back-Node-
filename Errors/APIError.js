class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isClientError = statusCode >= 400 && statusCode < 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = APIError;
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = (statusCode + '').startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Operational Error

    Error.captureStackTrace(this, this.constructor); // So that the constructor is not included in err.stackTrace
  }
}

module.exports = AppError;
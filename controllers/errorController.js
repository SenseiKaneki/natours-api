const AppError = require('../utils/appError');
const sendErrorDev = (err, res, req) => {
  if(req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    })
  } else {
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.message,
    })
  }
}
const sendErrorProd = (err, res, req) => {
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send messages to client
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    } else {
      // Programming or other unknown error: don't leak error details
      // 1) Log error
      console.error('ERROR 💥', err);

      // 2) Send a generic message
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong!',
      })
    }
  } else {
    // 1) Log error
    console.error('ERROR 💥', err);

    // 2) Send error page
    res.status(err.statusCode).render('error', {
      title: 'Something went wrong',
      msg: err.isOperational ? err.message : 'Please try again later!',
    })
  }
}
const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
}
const handleDuplicateFieldsDB = (err) => {
  const dupField = Object.values(err.keyValue)[0]
  return new AppError(`Duplicate field value: ${dupField}`, 400);
}
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((e) => e.properties.message)
  return new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
}
const handleJWEError = () => new AppError('Invalid Token. Please log in again!', 401);
const handleJWEExpiredError = () => new AppError('Token Expired. Please log in again!', 401);

module.exports = ((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res, req);
  } else if (process.env.NODE_ENV === 'production') {
    let error = {...err}
    error.message = err.message

    if (err.stack.includes('CastError')) error = handleCastErrorDB(err)
    else if (err.code === 11000) error = handleDuplicateFieldsDB(err)
    else if (err.stack.includes('ValidationError')) error = handleValidationErrorDB(err)
    else if (err.name === 'JsonWebTokenError') error = handleJWEError()
    else if (err.name === 'TokenExpiredError') error = handleJWEExpiredError()

    sendErrorProd(error, res, req);
  }
});
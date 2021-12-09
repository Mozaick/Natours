const AppError = require('../utils/appError');

// FIRST MONGOOSE ERROR
// INVALID ID
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// SECOND MONGOOSE ERROR
// DUPLICATE FIELDS THAT ARE SUPPOSED TO BE UNIQUE
const handleDuplicateFieldsDB = (err) => {
  const value = err.message.match(/(["'])(?:(?=(\\?))\2.)*?\1/);

  const message = `Duplicate field value: ${value[0]} is not allowed.`;
  return new AppError(message, 400);
};

// THIRD MONGOOSE ERROR
// VALIDATION ERROR
const handleValidationErrorDB = (err) => {
  const invalidErrorMessages = Object.values(err.errors).map(
    (el) => el.message
  );

  const message = `Invalid input data: ${invalidErrorMessages.join('. ')}`;
  return new AppError(message, 400);
};

// JWT Error
// Invalid token
const handleJWTError = () =>
  new AppError('Invalid token!! Please login again.', 401);

// JWT Error
// Expired token
const handleJWTExpire = () =>
  new AppError('Expired token!! Please login again.', 401);

// when on PRODUCTION MODE
/////////////////////////
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err);
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }

  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};

// when on DEV MODE
/////////////////////////
/////////////////////////
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // FIRST MONGOOSE ERROR
    // INVALID ID
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    // SECOND MONGOOSE ERROR
    // DUPLICATE FIELDS THAT ARE SUPPOSED TO BE UNIQUE
    if (err.code === 11000) err = handleDuplicateFieldsDB(err);

    // THIRD MONGOOSE ERROR
    // VALIDATION ERROR
    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);

    // JWT Error
    // Invalid token
    if (err.name === 'JsonWebTokenError') err = handleJWTError();

    // JWT Error
    // Expired token
    if (err.name === 'TokenExpiredError') err = handleJWTExpire();
    sendErrorProd(err, req, res);
  }
};

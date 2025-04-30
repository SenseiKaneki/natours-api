const path = require('path');
console.log('1 Done')
const express = require('express');
console.log('2 Done')
const morgan = require('morgan');
console.log('3 Done')
const rateLimit = require('express-rate-limit');
console.log('4 Done')
const helmet = require('helmet');
console.log('5 Done')
const mongoSanitize = require('express-mongo-sanitize');
console.log('6 Done')
const xss = require('xss-clean');
console.log('7 Done')
const hpp = require('hpp');
console.log('8 Done')
const cookieParser = require('cookie-parser');
console.log('9 Done')

const AppError = require('./utils/appError');
console.log('10 Done')
const globalErrorHandler = require('./controllers/errorController');
console.log('11 Done')
const tourRouter = require('./routes/tourRoutes');
console.log('12 Done')
const userRouter = require('./routes/userRoutes');
console.log('13 Done')
const reviewRouter = require('./routes/reviewRoutes');
console.log('14 Done')
const viewRouter = require('./routes/viewRoutes');
console.log('15 Done')

const pug = require('pug');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;

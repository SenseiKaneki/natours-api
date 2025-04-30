const model = require('./../models/userModel');
const CatchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const jwt = require('jsonwebtoken');
const util = require('util');
const crypto = require('crypto');
const sendEmail = require('./../utils/email');

const signToken = id => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES,
});
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000), // Number of dates * 24 hours * 60 minutes * 60 seconds * 1000 ms
  }
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Removes Password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  })
}

// MIDDLEWARE
// authController.getUserFromToken is only for rendered view pages !!!
exports.getUserFromToken = async (req, res, next) => {
  try {
    if (!(req.cookies.jwt)) return next();

    const token = req.cookies.jwt
    if (!token) return next();

    const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const user = await model.findById(decoded.id);
    if (!user) return next();

    const hasChanged = user.changedPasswordAfter(decoded.iat); // Date when token was issued
    if (hasChanged) return next();

    // 5) Grant access to a protected route
    res.locals.user = user;
    return next();
  } catch (error) {
    return next();
  }
};
exports.protect = CatchAsync(async (req, res, next) => {
  // 1) Check if token exists
  if (!(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) && !(req.cookies.jwt)) return next(new AppError('You are not logged in! Please log in to get access.', 401));
  const token = req.cookies.jwt || req.headers.authorization.split(' ')[1];

  // 2) Verify token
  const decoded = await util.promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const user = await model.findById(decoded.id);
  if (!user) return next(new AppError('The user does not exist! Please log in to get access.', 401));

  // 4) Check if user changed password after the token was issued
  // const hasChanged = user.changedPasswordAfter(decoded.iat * 1000); // Date when token was issued
  const hasChanged = user.changedPasswordAfter(decoded.iat); // Date when token was issued
  if (hasChanged) return next(new AppError('User recently changed password! Please log in to get access.', 401));

  // 5) Grant access to a protected route
  req.user = user;
  res.locals.user = user;
  next();
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return next(
      new AppError('Restricted route! Please log in to get access.', 403)
    );

    next();
  }
}

// ROUTE FUNCTIONS
exports.signup = CatchAsync(async (req, res, next) => {
  const newUser = await model.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  createSendToken(newUser, 201, res);
});
exports.login = CatchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if(!email || !password) {
    let errMsg = ''
    if (!email && !password) {
      errMsg = 'email and a password';
    } else if (!password) {
      errMsg = 'password';
    } else if (!email) {
      errMsg = 'email';
    }

    return next(
      new AppError(`Please provide a ${errMsg}`, 400)
    );
  }

  // 2) Check if user exists && password is correct
  const user = await model.findOne({ email: email }).select('+password');
  if (!user) return next(new AppError('Invalid email or password.', 401));

  const passwordCorrect = await user.comparePassword(password, user.password);
  if (!passwordCorrect) return next(new AppError('Invalid email or password.', 401));

  // 3) If everything is ok, send token to client
  createSendToken(user, 200, res);
});
exports.logout = (req, res,) => {
  res.cookie('jwt', 'logged out', {
    expires: new Date('12/02/2008'),
    httpOnly: true,
  })
  res.status(200).json({
    status: 'success',
  })
}

exports.forgotPassword = CatchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await model.findOne({ email: req.body.email });
  if (!user) return next(new AppError('There is no user with that email address', 404));

  // 2) Generate the random reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save();

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get('host')}${req.originalUrl.replace('forgot', 'reset')}/${resetToken}`;

  const message = `Forgot your password? Submit a request with your new password and passwordConfirm to: ${resetURL},\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Forgot your password',
      text: message,
    })
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return next(new AppError('There was an error sending the email. Please try again.', 500));
  }

  res.status(200).json({
    status: 'success',
    message: 'Token sent to email!'
  })
});
exports.resetPassword = CatchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');
  const user = await model.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } });

  // 2) If token has not expired and the user exists, set new password
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 3) Set the password changed at
  // -> See userModel Middleware

  // 4) Log the user in, send JWT
  createSendToken(user, 200, res);
})
exports.updatePassword = CatchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await model.findById(req.user._id).select('+password');

  if (!['passwordCurrent', 'password', 'passwordConfirm'].every(key => key in req.body)) return next(new AppError('Invalid arguments', 400))

  // 2) Check if posted password is correct
  if (!(await user.comparePassword(req.body['passwordCurrent'], user.password))) return next(new AppError('Invalid current password', 401));

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) Log user in (send JWT Token)
  createSendToken(user, 200, res);
})
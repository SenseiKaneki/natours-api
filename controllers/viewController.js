const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getOverview = catchAsync(async(req, res, next) => {
  // 1) Get tour Data From Collection
  const tours = await Tour.find();

  // 2) Render Template
  res.status(200).render('overview', {
    title: 'All Tours',
    tours
  })
});
exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user'
  });

  if (!tour) return next(new AppError('There is no tour with that name.', 404));

  res.status(200).render('tour', {
    title: tour.name,
    tour
  })
});
exports.getLoginForm = async (req, res) => {
  res.status(200).render('login', {
    title: 'Login into your account'
  });
}
exports.logout = async (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() - process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000), // Number of dates * 24 hours * 60 minutes * 60 seconds * 1000 ms
  }
  res.cookie('jwt', undefined, cookieOptions);
}
exports.getOwnAccount = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'Your Account',
  })
});

// exports.updateUserData = catchAsync(async(req, res, next) => {
//   const user = await User.findByIdAndUpdate(req.user.id, {
//     name: req.body.name,
//     email: req.body.email,
//   }, {
//     new: true,
//     runValidators: true
//   })
//   res.status(200).render('account', {
//     title: 'Your Account',
//     user: user,
//   })
// });
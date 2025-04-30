const Review = require('./../models/reviewModel');
const { deleteOne, updateOne, createOne, getOne, getAll } = require('./handlerFactory');
const AppError = require('../utils/appError');

// MIDDLEWARE
exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.author) req.body.author = req.user.id;
  next();
}
exports.setTourId = async (req, res, next) => {
  if (req.params.tourId) req.query.tour = req.params.tourId;
  next()
}
exports.checkIfReviewAuthor = async (req, res, next) => {
  const rev = await Review.findById(req.params.id);
  if (!rev) return next();

  if (rev.author.id === req.user.id) return next();
  else return next(new AppError('Only the author of a review and admins can edit a review.', 403));
}

exports.getAllReviews = getAll(Review);
exports.createReview = createOne(Review)
exports.deleteReview = deleteOne(Review);
exports.updateReview = updateOne(Review);
exports.getOneReview = getOne(Review);
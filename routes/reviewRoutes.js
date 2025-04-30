const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({
  mergeParams: true // With this, we get access to the other router that uses this router as middleware (tourRouter)
});

router.use(authController.protect);

router.route('/')
  .get(
    reviewController.setTourId,
    reviewController.getAllReviews
  )
  .post(
    authController.restrictTo('user'),
    reviewController.setTourUserIds,
    reviewController.createReview
  )
router.route('/:id')
  .get(
    reviewController.getOneReview
  )
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.checkIfReviewAuthor,
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.checkIfReviewAuthor,
    reviewController.deleteReview
  )

module.exports = router;
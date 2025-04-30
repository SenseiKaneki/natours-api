const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');
const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();


// router.route('/:tourId/reviews')
//   .get(authController.protect, reviewController.getAllReviews)
//   .post(authController.protect, authController.restrictTo('user'), reviewController.createReview)

router.use('/:tourId/reviews', reviewRouter) // With only this, the reviewRouter has no access to tourId

// Param Middleware
// router.param('id', tourController.checkId);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours)
router
  .route('/stats')
  .get(tourController.getTourStats)
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan)

router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin)
// /tours-within/233/center/-40,45/unit/mi    // mi == miles

router
  .route('/distances/:latlng/unit/:unit')
  .get(tourController.getDistances)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(authController.protect, authController.restrictTo('lead-guide', 'admin'), tourController.createTour);
  // .post(tourController.checkBody, tourController.createTour); // checkBody is the middleware for ONLY this post-request, because it is only here the parameter
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect, authController.restrictTo('lead-guide', 'admin'), tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('lead-guide', 'admin'), tourController.deleteTour);

// NESTED ROUTES

module.exports = router;
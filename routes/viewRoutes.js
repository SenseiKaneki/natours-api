const express = require('express');
const viewController = require('./../controllers/viewController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Routes that are protected
router
  .route('/me')
  .get(authController.protect, viewController.getOwnAccount)
// router.post('/submit-user-data', authController.protect, viewController.updateUserData)

router.use(authController.getUserFromToken)

// Routes where we need the users, but the Route is not protected
router
  .route('/')
  // .route(['/', '/overview'])
  .get(viewController.getOverview)
router
  .route('/tour/:slug')
  .get(viewController.getTour)
router
  .route('/login')
  .get(viewController.getLoginForm)
router
  .route('/logout')
  .get(viewController.logout)

module.exports = router;
const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:resetToken', authController.resetPassword);

router.use(authController.protect); // All Routes after this point will use this middleware

router.patch('/updateMyPassword', authController.protect, authController.updatePassword);

router.get('/me', userController.getMe, userController.getUser)
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe); // The field name is the name of the field in the form
router.delete('/deleteMe', userController.deleteMe)

router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser)
module.exports = router;
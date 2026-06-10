var express = require('express');
var router  = express.Router();

const authController = require('../Controllers/authController');

router.post('/register',              authController.register);
router.post('/login',                 authController.login);
router.get('/verify-email',           authController.verifyEmail);
router.post('/resend-verify-email',   authController.resendVerifyEmail);
router.post('/forgot-password',       authController.forgotPassword);
router.post('/reset-password',        authController.resetPassword);


module.exports = router;
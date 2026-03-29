const express = require('express')
const router = express.Router()
const validate = require("../middlewares/validate");
const user = require("../controllers/auth.controller");
const users = require('../schemas/users');
const { Authentication } = require('../middlewares/Authentication');

router.post("/login", validate(users.logInSchema), user.login);
router.post("/signup", validate(users.createUserSchema), user.signup);
router.get("/google", user.googleAuth);
router.get("/google/callback", user.googleCallback);

router.post("/forgot-password", validate(users.forgotPasswordSchema), user.forgotPassword);
router.post("/verify-otp", validate(users.verifyOTPSchema), user.verifyOTP);
router.post("/reset-password", validate(users.resetPasswordSchema), user.resetPassword);

router.patch("/change-password", Authentication, validate(users.changePasswordSchema), user.changePassword);

module.exports = router
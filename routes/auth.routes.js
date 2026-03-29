const express = require('express')
const router = express.Router()
const validate = require("../middlewares/validate");
const user = require("../controllers/auth.controller");
const users = require('../schemas/users');

router.post("/login", validate(users.logInSchema), user.login);
router.post("/signup", validate(users.createUserSchema), user.signup);
router.get("/google", user.googleAuth);
router.get("/google/callback", user.googleCallback);

module.exports = router
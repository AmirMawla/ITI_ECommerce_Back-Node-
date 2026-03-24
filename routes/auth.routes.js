const express = require('express')
const router = express.Router()

const user = require("../controllers/auth.controller")

router.post("/login", user.login);
router.post("/signup", user.signup);
router.get("/google", user.googleAuth);
router.get("/google/callback", user.googleCallback);

module.exports = router
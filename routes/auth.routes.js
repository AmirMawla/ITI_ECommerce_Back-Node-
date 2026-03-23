const express = require('express')
const router = express.Router()

const user = require("../controllers/auth.controller")

router.post("/login", user.login);
router.post("/signup", user.signup);

module.exports = router
const express = require("express");
const router = express.Router();
const { login } = require("../controllers/authController");

router.post("/auth", login);

module.exports = router;

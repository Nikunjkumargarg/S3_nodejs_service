const express = require("express");
const router = express.Router();
const s3Controller = require("../controllers/s3Controller");
const {
  validateLogin,
  validateRegister,
  validateRefreshToken,
  handleValidationErrors,
} = require("../validationRules");

//register user route
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  s3Controller.register
);

//login user route
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  s3Controller.login
);

//refresh token route
router.post("/refreshtoken", validateRefreshToken, s3Controller.refreshToken);

module.exports = router;

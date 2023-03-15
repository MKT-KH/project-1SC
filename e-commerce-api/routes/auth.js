const express = require("express");
const { body } = require("express-validator/check");

const authControllers = require("../controllers/auth");
const passport = require("../passport-setup");

const router = express.Router();

router.put(
  "/signup",
  [
    body("email").isEmail().trim(),
    body("password").isAlphanumeric().trim().isLength({ min: 8 }),
    body("name").isLength({ min: 4 }),
    // body('phoneNumber').custom()
  ],
  authControllers.signUp
);
router.post("/login", authControllers.login);
router.get("/verify/:userId", authControllers.verifyEmail);
router.post("/reset", authControllers.tokenForgetPassword);
router.post("/reset/:token", authControllers.resetPassword);
router.get(
  "/google/callback",
  passport.authenticate("google"),
  authControllers.signInGoogle
);
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

module.exports = router;

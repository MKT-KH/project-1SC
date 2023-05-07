const express = require("express");
const { body } = require("express-validator/check");
const multer = require("multer");

const authControllers = require("../controllers/auth");
const passport = require("../config/passport-setup");
const storage = require("../config/cloudinary");

const upload = multer({ storage: storage.storageProfileImages });

const router = express.Router();

router.post(
  "/signup",
  upload.single("image"),
  [
    body("email").isEmail().trim(),
    body("password")
      .isAlphanumeric()
      .trim()
      .isLength({ min: 8 })
      .withMessage("the password should be at least 8 digits"),
    body("name").isLength({ min: 4 }),
    body("phone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be exactly 10 digits")
      .matches(/^[0-9]+$/)
      .withMessage("Phone number must only contain digits"),
  ],
  authControllers.signUp
);
router.post("/login", authControllers.login);
router.get("/verify/:userId", authControllers.verifyEmail);
router.get("/reset/form/:token", authControllers.getForm);
router.post(
  "/reset/:token",
  body("password")
    .isAlphanumeric()
    .trim()
    .isLength({ min: 8 })
    .withMessage("the password should be at least 8 digits"),
  authControllers.resetPassword
);
router.post("/reset", authControllers.tokenForgetPassword);
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

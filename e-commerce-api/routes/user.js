const express = require("express");
const { body } = require("express-validator/check");

const router = express.Router();

const userControllers = require("../controllers/user");
const isAuth = require("../Middleware/is-auth");

router.patch(
  "/edit",
  [
    body("updatedEmail").isEmail().trim(),
    body("updatedPassword")
      .isAlphanumeric()
      .trim()
      .isLength({ min: 8 })
      .withMessage("the password should be at least 8 digits"),
    body("updatedName").isLength({ min: 4 }),
    body("updatedPhone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone number must be exactly 10 digits")
      .matches(/^[0-9]+$/)
      .withMessage("Phone number must only contain digits"),
  ],
  isAuth,
  userControllers.editUser
);
module.exports = router;

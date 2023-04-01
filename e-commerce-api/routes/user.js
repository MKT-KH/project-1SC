const express = require("express");
const { body } = require("express-validator/check");
const multer = require("multer");

const storage = require("../config/cloudinary");

const upload = multer({ storage: storage.storageProfileImages });

const router = express.Router();

const userControllers = require("../controllers/user");
const isAuth = require("../Middleware/is-auth");

router.patch(
  "/edit",
  upload.single("image"),
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
router.post("/cart/:productId", isAuth, userControllers.addToCart);
router.delete("/cart/:productId", isAuth, userControllers.deleteFromCart);
//router.patch("/cart/:productId", isAuth, userControllers);
router.delete("/cart", isAuth, userControllers.deleteCart);
router.post("/order", isAuth, userControllers.Postorder);
module.exports = router;

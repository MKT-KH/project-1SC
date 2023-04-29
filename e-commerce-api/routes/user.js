const express = require("express");
const { body } = require("express-validator/check");
const multer = require("multer");

const storage = require("../config/cloudinary");

const upload = multer({ storage: storage.storageProfileImages });

const router = express.Router();

const userControllers = require("../controllers/user");
const isAuth = require("../middleware/is-auth");
const { compare } = require("bcryptjs");

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
router.put("/cart/:userId", isAuth, userControllers.updateCart);
router.get("/cart", isAuth, userControllers.getCart);
router.delete("/cart", isAuth, userControllers.deleteCart);
router.post("/order", isAuth, userControllers.postorder);
router.delete("/order/:orderId", isAuth, userControllers.delteOrder);
router.post("/favorites/:productId", isAuth, userControllers.addToFavorites);
router.get("/favorites", isAuth, userControllers.getFavorites);
router.delete(
  "/favorites/:productId",
  isAuth,
  userControllers.deleteFromFavorites
);
module.exports = router;

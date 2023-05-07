const express = require("express");
const { body } = require("express-validator/check");
const multer = require("multer");

const storage = require("../config/cloudinary");

const upload = multer({ storage: storage.storageProfileImages });

const router = express.Router();

const userControllers = require("../controllers/user");
const isAuth = require("../middleware/is-auth");
const { compare } = require("bcryptjs");

router.put("/edit", upload.single("image"), isAuth, userControllers.editUser);
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
router.post("/product/:productId", isAuth, userControllers.addRating);
module.exports = router;

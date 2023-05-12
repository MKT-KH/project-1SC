const express = require("express");
const { body } = require("express-validator/check");
const multer = require("multer");

const storage = require("../config/cloudinary");
const userControllers = require("../controllers/user");
const isAuth = require("../middleware/is-auth");

const upload = multer({ storage: storage.storageProfileImages });

const router = express.Router();

router.put("/edit", upload.single("image"), isAuth, userControllers.editUser);
router.post("/cart/:productId", isAuth, userControllers.addToCart);
router.delete(
  "/cart/product/:productId",
  isAuth,
  userControllers.deleteFromCart
);
router.put("/cart/:userId", isAuth, userControllers.updateCart);
router.get("/cart", isAuth, userControllers.getCart);
router.delete("/cart/:cartId", isAuth, userControllers.deleteCart);
router.post("/order", isAuth, userControllers.postorder);
//router.delete("/order/:orderId", isAuth, userControllers.delteOrder);
router.post("/favorites/:productId", isAuth, userControllers.addToFavorites);
router.get("/favorites", isAuth, userControllers.getFavorites);
router.delete(
  "/favorites/:productId",
  isAuth,
  userControllers.deleteFromFavorites
);
router.post("/product/:productId", isAuth, userControllers.addRating);
router.get("/history/:userId", isAuth, userControllers.getHistoric);
router.get("/user-info/:userId", isAuth, userControllers.getInfoAboutUser);
router.delete("/history", isAuth, userControllers.clearHistory);
router.post(
  "/comment",
  [
    body("comment")
      .isLength({ min: 5, max: 25 })
      .withMessage("Sorry, it looks like your comment is too long"),
  ],
  isAuth,
  userControllers.addComment
);
router.post("/club", isAuth, userControllers.joinClub);
router.delete("/club", isAuth, userControllers.leaveClub);
module.exports = router;

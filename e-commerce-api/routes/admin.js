const express = require("express");

const router = express.Router();

const isAdmin = require("../middleware/is-admin");
const isAuth = require("../middleware/is-auth");
const adminControllers = require("../controllers/admin");
const multer = require("multer");
const storage = require("../config/cloudinary");

const upload = multer({ storage: storage.storageProductImages });

router.put(
  "/product",
  upload.array("images"),
  isAuth,
  isAdmin,
  adminControllers.createProduct
);
router.patch(
  "/product/:productId",
  upload.array("images"),
  isAuth,
  isAdmin,
  adminControllers.editProduct
);
router.delete(
  "/product/:productId",
  isAuth,
  isAdmin,
  adminControllers.deleteProduct
);
router.get("/orders", isAuth, isAdmin, adminControllers.getOrders);
router.get(
  "/money/statistics",
  isAuth,
  isAdmin,
  adminControllers.getStatisticsAboutOrdersPrice
);
router.get(
  "/orders/statistics",
  isAuth,
  isAdmin,
  adminControllers.getStatisticsAboutOrders
);
router.patch(
  "/order/status/:orderId",
  isAuth,
  isAdmin,
  adminControllers.changeEtatOrder
);
router.get(
  "/products/statistics",
  isAuth,
  isAdmin,
  adminControllers.getInformationABoutProducts
);
router.get(
  "/types/:type",
  isAuth,
  isAdmin,
  adminControllers.getProductsForType
);
module.exports = router;

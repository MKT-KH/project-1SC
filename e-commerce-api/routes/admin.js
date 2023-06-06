const express = require("express");
const multer = require("multer");
const { body } = require("express-validator/check");

const isAdmin = require("../middleware/is-admin");
const isAuth = require("../middleware/is-auth");
const adminControllers = require("../controllers/admin");
const storage = require("../config/cloudinary");

const router = express.Router();

const upload = multer({ storage: storage.storageProductImages });

router.post(
  "/product",
  upload.array("images"),
  isAuth,
  isAdmin,
  adminControllers.createProduct
);
router.put(
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
router.get("/users", isAuth, isAdmin, adminControllers.getUsers);
router.patch("/etat/:userId", isAuth, isAdmin, adminControllers.ChangeEtatUser);
router.post(
  "/add-admin/:userId",
  isAuth,
  isAdmin,
  adminControllers.createAdmin
);
router.post(
  "/discount/:productId",
  [
    body("discount")
      .isInt({ min: 0, max: 100 })
      .withMessage("Number must be between 0 and 100"),
  ],
  isAuth,
  isAdmin,
  adminControllers.addDiscount
);

router.post(
  "/add-admin-roles/:userId",
  isAuth,
  isAdmin,
  adminControllers.addRolesForAdmin
);
router.post(
  "/deleteAdmin/:userId",
  isAuth,
  isAdmin,
  adminControllers.deleteAdmin
);
router.delete(
  "/delete-role/:userId",
  isAuth,
  isAdmin,
  adminControllers.deleteRoleForAdmin
);
module.exports = router;

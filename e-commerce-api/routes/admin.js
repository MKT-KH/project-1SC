const express = require("express");

const router = express.Router();

const isAdmin = require("../Middleware/is-admin");
const isAuth = require("../Middleware/is-auth");
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

module.exports = router;

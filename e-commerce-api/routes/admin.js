const express = require("express");

const router = express.Router();

const isAdmin = require("../Middleware/is-admin");
const isAuth = require("../Middleware/is-auth");
const adminControllers = require("../controllers/admin");

router.put("/product", isAuth, isAdmin, adminControllers.createProduct);
// router.patch("/product", isAdmin, adminControllers.editProduct);
router.delete(
  "/product/:productId",
  isAuth,
  isAdmin,
  adminControllers.deleteProduct
);

module.exports = router;

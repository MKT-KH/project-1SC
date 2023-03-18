const express = require("express");

const router = express.Router();

const isAdmin = require("../Middleware/is-admin");
const adminControllers = require("../controllers/admin");

// router.put("/product", isAdmin, adminControllers.createProduct);
// router.patch("/product", isAdmin, adminControllers.editProduct);
// router.get("/product", isAdmin, adminControllers.deleteProduct);

module.exports = router;

const express = require("express");

const shopControllers = require("../controllers/shop");

const router = express.Router();

router.get("/", shopControllers.getProducts);
router.get("/types", shopControllers.getTypes);
router.get("/:productId", shopControllers.getProduct);

module.exports = router;

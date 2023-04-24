const express = require("express");

const shopControllers = require("../controllers/shop");

const router = express.Router();

router.get("/", shopControllers.getProducts);
router.get("/:productId", shopControllers.getProduct);
router.get("/types", shopControllers.getTypes);

module.exports = router;

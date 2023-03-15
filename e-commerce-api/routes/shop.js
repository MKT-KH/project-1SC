const express = require('express');

const shopControllers = require('../controllers/shop');
const isAuth = require('../Middleware/is-auth');

const router = express.Router();

router.get('/', isAuth, shopControllers.getProducts);
router.get('/:productId', isAuth, shopControllers.getProduct);

module.exports = router
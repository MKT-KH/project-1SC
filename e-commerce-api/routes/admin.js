const express = require('express');

const router = express.Router();

const adminControllers = require('../controllers/admin');

router.put('/product', adminControllers.createProduct);

module.exports = router;
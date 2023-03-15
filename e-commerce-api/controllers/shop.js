const Product = require('../models/product');

exports.getProducts = (req, res, next) => {
    Product.find().then(products => {
        if (products.length < 1) {
            return res.status(404).json({
                message: 'no goal found'
            })
        }
        res.status(200).json({
            message: 'goal found',
            products: products
        })
    }).catch(err => {
        if (!err.status) {
            err.status = 500
        }
        next(err);
    })
};

exports.getProduct = (req, res, next) => {
    const productId = req.params.productId;
    Goal.findById(productId).then(product => {
        if (!product) {
            return res.status(404).json({
                message: 'no goal found'
            })
        }
        res.status(200).json({
            message: 'goal found succsufulyy',
            product: product
        })
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err)
    })

}
const Product = require('../models/product');

exports.createProduct = (req, res, next) => {
    const title = req.body.title;
    const product = new Product({
        title: title
    })
    product.save().then(result => {
        res.status(201).json({
            message: 'product created succuflyy',
            productId: product._id
        })
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err)
    });

}
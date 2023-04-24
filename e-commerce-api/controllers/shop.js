const Product = require("../models/product");

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find();
    if (products.length < 1) {
      const err = new Error("products not found");
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: "products",
      products: products,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: "product found succsufulyy",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getTypes = async (req, res, next) => {
  try {
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

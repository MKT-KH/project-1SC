const Product = require("../models/product");
const Comment = require("../models/comment");

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
    const types = await Product.distinct("type");
    const typesCount = [];

    for (const type of types) {
      const numberOfProducts = await Product.countDocuments({ type: type });
      typesCount.push({ type: type, count: numberOfProducts });
    }

    const totalProducts = await Product.find().countDocuments();
    res.status(200).json({
      message: "the types and the number of the products in each type",
      typesCount: typesCount,
      message: "the total number of products",
      totalProducts: totalProducts,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getComments = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const comments = await Comment.find({ productId: productId });
    if (comments.length < 1) {
      const err = new Error("no comment found for this product");
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: "all the comments about this product",
      comments: comments,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

const path = require("path");

cloudinary = require("cloudinary");

const Product = require("../models/product");

exports.createProduct = async (req, res, next) => {
  const name = req.body.name;
  const price = req.body.price;
  const type = req.body.type;
  const quantity = req.body.quantity;
  const colors = req.body.colors;
  const images = req.files.map((file) => file.path);
  try {
    const exsitsProduct = await Product.findOne({ name: name });
    if (exsitsProduct) {
      const error = new Error("the product is aleardy exsits");
      error.status = 400;
      return next(error);
    }

    const product = new Product({
      name: name,
      type: type,
      price: price,
      quantity: quantity,
      imageUrl: images,
      colors: colors,
    });
    await product.save();
    res.status(201).json({
      message: "product add succsufly",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.editProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 409;
      return next(err);
    }

    const name = req.body.name;
    const price = req.body.price;
    const type = req.body.type;
    const quantity = req.body.quantity;
    const colors = req.body.colors;
    const images = req.files.map((file) => file.path);

    product.name = name;
    product.price = price;
    product.type = type;
    product.quantity = quantity;
    product.colors = colors;

    if (images.length >= 1) {
      const publicIds = product.imageUrl.map((publicId) => {
        return (
          "productImages/" + path.basename(publicId, path.extname(publicId))
        );
      });
      publicIds.forEach((publicId) => {
        cloudinary.uploader.destroy(publicId, function (error, result) {
          if (error) {
            console.log("Error:", error);
          } else {
            console.log("Result:", result);
          }
        });
      });
      product.imageUrl = images;
    }
    await product.save();
    res.status(200).json({
      message: "the product is update",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("no product found");
      error.status = 404;
      return next(error);
    }
    const publicIds = product.imageUrl.map((publicId) => {
      return "productImages/" + path.basename(publicId, path.extname(publicId));
    });

    publicIds.forEach((publicId) => {
      cloudinary.uploader.destroy(publicId, function (error, result) {
        if (error) {
          console.log("Error:", error);
        } else {
          console.log("Result:", result);
        }
      });
    });
    await Product.findByIdAndRemove(productId);
    res.status(200).json({
      message: "the product is deleted",
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

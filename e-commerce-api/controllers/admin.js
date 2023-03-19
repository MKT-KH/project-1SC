const fs = require("fs");
const path = require("path");

const Product = require("../models/product");
const User = require("../models/user");

exports.createProduct = async (req, res, next) => {
  const name = req.body.name;
  const price = req.body.price;
  const type = req.body.type;
  const quantity = req.body.quantity;
  const colors = req.body.colors;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("no admin found");
      error.status = 404;
      next(error);
    }
    if (!user.isAdmin) {
      const error = new Error("admin authorization");
      error.status = 403;
      next(error);
    }
    const exsitsProduct = await Product.findOne({ name: name });
    if (exsitsProduct) {
      const error = new Error("the product is aleardy exsits");
      error.status = 400;
      next(error);
    }

    const product = new Product({
      name: name,
      type: type,
      price: price,
      quantity: quantity,
      imageUrl: req.files.map((file) => file.path),
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

exports.createProduct = async (req, res, next) => {
  const name = req.body.name;
  const price = req.body.price;
  const type = req.body.type;
  const quantity = req.body.quantity;
  const colors = req.body.colors;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("no admin found");
      error.status = 404;
      throw error;
    }
    if (!user.isAdmin) {
      const error = new Error("admin authorization");
      error.status = 403;
      next(error);
    }
    const exsitsProduct = await Product.findOne({ name: name });
    if (exsitsProduct) {
      const error = new Error("the product already exists");
      error.status = 400;
      throw error;
    }

    const product = new Product({
      name: name,
      type: type,
      price: price,
      quantity: quantity,
      colors: colors,
    });

    // Only upload images if product doesn't already exist
    if (!exsitsProduct) {
      const imagesPath = req.files.map((file) => file.path);
      product.imageUrl = imagesPath;
    }

    await product.save();
    res.status(201).json({
      message: "product added successfully",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  const name = req.body.name;
  const price = req.body.price;
  const type = req.body.type;
  const quantity = req.body.quantity;
  const imagesPath = req.files.map((file) => file.path);
  const colors = req.body.colors;

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("no admin found");
      error.status = 404;
      throw error;
    }
    if (!user.isAdmin) {
      const error = new Error("admin authorization");
      error.status = 403;
      next(error);
    }
    const existingProduct = await Product.findOne({ name: name });
    if (existingProduct) {
      // remove the uploaded images
      for (let i = 0; i < imagesPath.length; i++) {
        fs.unlink(imagesPath[i], (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      const error = new Error("the product already exists");
      error.status = 400;
      throw error;
    }

    const product = new Product({
      name: name,
      type: type,
      price: price,
      quantity: quantity,
      imageUrl: imagesPath,
      colors: colors,
    });

    await product.save();
    res.status(201).json({
      message: "product added successfully",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.editProduct = (req, res, next) => {};

exports.deleteProduct = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("no product found");
      error.status = 404;
      next(error);
    }
    product.imageUrl.forEach((path) => {
      clearImage(path);
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

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

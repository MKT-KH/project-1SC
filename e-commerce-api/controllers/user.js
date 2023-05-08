const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");
const path = require("path");

const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");

exports.editUser = async (req, res, next) => {
  const updatedName = req.body.updatedName;
  const updatedEmail = req.body.updatedEmail;
  const updatedAdress = req.body.updatedAdress;
  const currentPassword = req.body.currentPassword;
  const updatedPassword = req.body.updatedPassword;
  const confirmedUpdatedPassword = req.body.confirmedUpdatedPassword;
  const updatedPhone = req.body.updatedPhone;
  const image = req.file;
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      return next(error);
    }
    if (user._id.toString() !== req.userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    if (updatedEmail !== user.email) {
      const exsistUser = await User.findOne({ email: updatedEmail });
      if (exsistUser) {
        const error = new Error(
          "the email is alerdy in use please take nother email"
        );
        error.status = 409;
        return next(error);
      }
    }
    if (updatedPassword) {
      if (updatedPassword.length < 8) {
        const error = new Error(
          "The password should be at least 8 characters long"
        );
        error.status = 422;
        return next(error);
      }
      if (confirmedUpdatedPassword !== updatedPassword) {
        const err = new Error("the two passwords are not matched");
        err.status = 401;
        return next(err);
      }
      const isEqual = await bcrypt.compare(currentPassword, user.password);
      if (!isEqual) {
        const err = new Error(
          "the password is not correct , you cant update the password"
        );
        err.status = 401;
        return next(err);
      }

      const hashedPassword = await bcrypt.hash(updatedPassword, 12);
      user.password = hashedPassword;
    }
    if (updatedName) {
      if (updatedPassword.length < 4) {
        const error = new Error("the name is at least 4 charchter");
        error.status = 422;
        return next(error);
      }
      user.name = updatedName;
    }
    if (updatedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updatedEmail)) {
        const error = new Error("Please enter a valid email address");
        error.status = 422;
        return next(error);
      }
      user.email = updatedEmail;
    }

    if (updatedPhone) {
      if (!/^[0-9]{10}$/.test(updatedPhone)) {
        const error = new Error("Phone number must be exactly 10 digits");
        error.status = 422;
        return next(error);
      }
      user.phoneNumber = updatedPhone;
    }

    if (updatedAdress) {
      user.address = updatedAdress;
    }

    if (image) {
      if (!user.imageUrl) {
        user.imageUrl = image.path;
      } else {
        const url = user.imageUrl;
        const publicId =
          "profileImages/" + path.basename(url, path.extname(url));
        cloudinary.uploader.destroy(publicId, function (error, result) {
          if (error) {
            console.log("Error:", error);
          } else {
            console.log("Result:", result);
          }
        });
        user.imageUrl = image.path;
      }
    }
    await user.save();
    res.status(200).json({
      message: "the user is upated",
      user: user,
    });
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  const userId = req.userId;
  const productId = req.params.productId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const product = await Product.findById(productId);
    const cart = user.cart;
    const exsitsProduct = cart.items.findIndex((item) => {
      return item.productId.toString() === productId;
    });
    //console.log(exsitsProduct);
    if (exsitsProduct !== -1) {
      if (product.quantity >= 1) {
        cart.items[exsitsProduct].quantity += 1;
        cart.items[exsitsProduct].totalePrice =
          cart.items[exsitsProduct].totalePrice +
          product.price * cart.items[exsitsProduct].quantity;
      } else {
        const error = new Error(
          "you cant add the product the qty is not enough"
        );
        return next(error);
      }
    } else {
      if (product.quantity >= 1) {
        const newItem = {
          productId: productId,
          quantity: 1,
          totalePrice: product.price,
        };
        cart.items.push(newItem);
      } else {
        const error = new Error(
          "you cant add the product the qty is not enough"
        );
        return next(error);
      }
    }
    const date = new Date();
    const history = user.history.items;
    history.push({ productId: productId, date: date, action: "add to cart" });
    await user.save();
    res.status(200).json({
      message: "add to cart succsuflyy",
      cart: user.cart,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getCart = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const cart = user.cart.items;
    for (const item2 of cart) {
      const prodcut = await Product.findById(item2.productId);
      if (!prodcut) {
        const index = cart.findIndex((item) => {
          return item.productId === item2.productId;
        });
        cart.splice(index, 1);
        await user.save();
      }
    }
    res.status(200).json({
      message: "cart",
      cart: cart,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.deleteCart = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    user.cart.items = [];
    await user.save();
    res.status(200).json({
      message: "cart deleted",
      cart: user.cart,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.deleteFromCart = async (req, res, next) => {
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 404;
      return next(err);
    }
    const userId = req.userId;
    const user = await User.findById(userId);
    cart = user.cart;
    const exsistsProductInCart = cart.items.findIndex((item) => {
      return item.productId.toString() === productId;
    });
    //console.log(exsistsProductInCart);
    if (exsistsProductInCart === -1) {
      const err = new Error("no product found in the cart");
      err.status = 404;
      return next(err);
    } else {
      cart.items.splice(exsistsProductInCart, 1);
      const date = new Date();
      const history = user.history.items;
      history.push({
        productId: productId,
        date: date,
        action: "delete from cart",
      });
      await user.save();
    }
    res.status(200).json({
      message: "the product is deleted from cart",
      cart: user.cart,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.postorder = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const cart = user.cart;
    const products = cart.items.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    });
    const order = new Order({
      products: products,
      userId: userId,
      orderDate: new Date(),
    });
    await order.save();
    user.cart.items = [];
    user.orderIds.items.push(order._id);
    await user.save();
    res.status(201).json({
      message: "order create succsuflyy",
      order: order,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.delteOrder = async (req, res, next) => {
  const orderId = req.params.orderId;
  const userId = req.userId;
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error("no order found");
      err.status = 404;
      return next(err);
    }
    if (order.userId.toString() !== userId) {
      const err = new Error("not authorized to delte order");
      err.status = 401;
      return next(err);
    }
    await Order.findByIdAndRemove(orderId);
    res.status(200).json({
      message: "order delted",
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getFavorites = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId).populate(
      "favorites.items.productId"
    );
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId) {
      const err = new Error("not auhtorized user");
      err.status = 401;
      return next(err);
    }
    if (!user.favorites) {
      const err = new Error("no favorites for this user ");
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: "fovorites",
      favorites: user.favorites.items,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.addToFavorites = async (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.userId;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 404;
      return next(err);
    }
    const user = await User.findById(userId);
    if (user._id.toString() !== userId) {
      const err = new Error("not auhtorized user");
      err.status = 401;
      return next(err);
    }
    const existaProductInFavorites = user.favorites.items.findIndex((item) => {
      return item.productId.toString() === productId;
    });
    if (existaProductInFavorites !== -1) {
      const err = new Error("the product is ealrdy exists in the favorite");
      err.status = 409;
      return next(err);
    }
    user.favorites.items.push({ productId });
    await user.save();
    const populateUser = await User.findById(userId).populate(
      "favorites.items.productId"
    );
    res.status(200).json({
      message: "add to fovorites succusuflyy",
      favorites: populateUser.favorites.items,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.deleteFromFavorites = async (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.userId;
  try {
    const user = await User.findById(userId);

    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId) {
      const err = new Error("not auhtorized user");
      err.status = 401;
      return next(err);
    }
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 404;
      return next(err);
    }
    const existaProductInFavorites = user.favorites.items.findIndex((item) => {
      return item.productId.toString() === productId;
    });
    if (existaProductInFavorites === -1) {
      const err = new Error("the product is not in the favorites");
      err.status = 404;
      return next(err);
    }
    user.favorites.items.splice(existaProductInFavorites, 1);
    await user.save();
    const populateUser = await User.findById(userId).populate(
      "favorites.items.productId"
    );
    res.status(200).json({
      message: "the product is deleted from the favorites",
      favorites: populateUser.favorites,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.updateCart = async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   const error = new Error("the cart schema is not matched");
  //   error.status = 422;
  //   error.data = errors.array();
  //   return next(error);
  // }

  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const cart = req.body.cart;
    for (const prodcutCart of cart.items) {
      const prodDataBase = await Product.findById(prodcutCart.productId);
      if (prodDataBase.quantity < prodcutCart.quantity) {
        const err = new Error(
          `the qty is not enough for this prodcut with id : ${prodcutCart.productId}`
        );
        return next(err);
      }
    }
    user.cart.items = cart.items;
    await user.save();
    res.status(200).json({
      message: "the cart is update",
      cart: user.cart,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.addRating = async (req, res, next) => {
  const productId = req.params.productId;
  const rate = req.body.rate;
  try {
    const product = await Product.findById(productId);
    if (!product) {
      const error = new Error("no product found");
      error.status = 404;
      return next(error);
    }
    product.allRate.rating.push({
      userId: req.userId,
      ratingValue: rate,
      ratingDate: new Date(),
    });
    const rates = product.allRate.rating;
    const length = product.allRate.rating.length;
    let allRatesValue = 0;
    for (const rate of rates) {
      allRatesValue = allRatesValue + rate.ratingValue;
    }
    product.rate = allRatesValue / length;
    await product.save();
    res.status(200).json({
      message: "the rate is added succsufly",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};
exports.getHistoric = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: "historic for the user",
      history: user.history,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getInfoAboutUser = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("user not found");
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: "the info about user",
      user: user,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

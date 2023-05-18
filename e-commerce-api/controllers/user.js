const path = require("path");
const fs = require("fs");

const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");
const PDFDocument = require("pdfkit");

const Cart = require("../models/cart");
const User = require("../models/user");
const Product = require("../models/product");
const Order = require("../models/order");
const Rating = require("../models/rating");
const Favorite = require("../models/favorite");
const History = require("../models/history");
const Comment = require("../models/comment");
const Club = require("../models/club");
const Invoice = require("../models/invoice");
const user = require("../models/user");

cloudinary.config({
  api_key: process.env.CLOUDIANRY_API_KEY,
  api_secret: process.env.CLOUDIANRY_SECRET_KEY,
  cloud_name: process.env.CLOUDIANRY_CLOUD_NAME,
});

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
      if (updatedName.length < 4) {
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
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    //await User.populate("cart")
    res.status(200).json({
      message: "user info",
      user: user,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.addToCart = async (req, res, next) => {
  const userId = req.userId;
  const quantity = req.body.quantity;
  const productId = req.params.productId;
  try {
    const product = await Product.findById(productId);
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId) {
      const err = new Error("not authorized ");
      err.status = 403;
      return next(err);
    }
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      const newCart = new Cart({
        userId: userId,
      });
      if (product.quantity >= quantity) {
        newCart.productId = productId;
        newCart.items.push({
          productId: productId,
          quantity: quantity,
          totalePrice: quantity * product.price,
        });
        await newCart.save();
        await newCart.populate("items.productId");
        user.cartId = newCart.id;
        await user.save();

        const newHistory = new History({
          userId: userId,
          productId: productId,
          date: new Date(),
          action: "add to cart",
        });

        await newHistory.save();
        user.historyIds.items.push({ historyId: newHistory.id });
        await user.save();

        return res.status(200).json({
          message: "product add succsufly",
          cart: newCart,
          history: newHistory,
        });
      } else {
        const err = new Error("you cant add to the cart the qty is not enough");
        return next(err);
      }
    } else {
      const exsitsProduct = cart.items.findIndex((item) => {
        return item.productId.toString() === productId;
      });
      if (exsitsProduct === -1) {
        if (product.quantity >= quantity) {
          cart.items.push({
            productId: productId,
            quantity: quantity,
            totalePrice: product.price,
          });
        } else {
          const err = new Error(
            "you cant add to the cart the qty is not enough"
          );
          return next(err);
        }
      } else {
        if (product.quantity >= quantity) {
          cart.items[exsitsProduct].quantity =
            cart.items[exsitsProduct].quantity + quantity;
          cart.items[exsitsProduct].totalePrice =
            cart.items[exsitsProduct].quantity * product.price;
        } else {
          const err = new Error(
            "you cant add to the cart the qty is not enough"
          );
          return next(err);
        }
      }

      await cart.save();
      await cart.populate("items.productId");

      const newHistory = new History({
        userId: userId,
        productId: productId,
        date: new Date(),
        action: "add to cart",
      });

      await newHistory.save();
      user.historyIds.items.push({ historyId: newHistory.id });
      await user.save();

      res.status(200).json({
        message: "the product is add succsufly",
        cart: cart,
        history: newHistory,
      });
    }
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
    if (user._id.toString() !== req.userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const cart = await Cart.findOne({ userId: userId }).populate(
      "items.productId"
    );
    if (!cart) {
      const err = new Error("this use have no cart");
      err.status = 404;
      return next(err);
    }
    const cartItems = cart.items;
    for (const item2 of cartItems) {
      const prodcut = await Product.findById(item2.productId);
      if (!prodcut) {
        const index = cart.findIndex((item) => {
          return item.productId === item2.productId;
        });
        cart.splice(index, 1);
        await cart.save();
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
  const cartId = req.params.cartId;
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("No user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== req.userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const cart = await Cart.findById(cartId);
    if (!cart) {
      const err = new Error("no cart found for this user");
      err.status = 404;
      return next(err);
    }
    await Cart.findByIdAndRemove(cartId);

    user.cartId = null;
    await user.save();

    res.status(200).json({
      message: "the cart is delted",
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.deleteFromCart = async (req, res, next) => {
  const userId = req.userId;
  const productId = req.params.productId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== req.userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      const err = new Error("no cart found for this user");
      err.status = 404;
      return next(err);
    }
    const cartItems = cart.items;
    const existsProdcutInCart = cartItems.findIndex((item) => {
      return item.productId.toString() === productId;
    });
    if (existsProdcutInCart !== -1) {
      cart.items.splice(existsProdcutInCart, 1);
      await cart.save();
    } else {
      const err = new Error("the prodcut is not exixts in the cart");
      err.status = 404;
      return next(err);
    }

    const newHistory = new History({
      userId: userId,
      productId: productId,
      date: new Date(),
      action: "deleted from cart",
    });

    await newHistory.save();
    user.historyIds.items.push({ historyId: newHistory.id });
    await user.save();

    res.status(200).json({
      message: "the product is delted",
      cart: cart,
      history: newHistory,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.updateCart = async (req, res, next) => {
  const cartItem = req.body.cartItem.items;
  const userId = req.params.userId;
  console.log("hh");
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const cart = await Cart.findOne({ userId: userId });
    if (!cart) {
      const err = new Error("no cart found");
      err.status = 404;
      return next(err);
    }

    cart.items = cartItem;

    await cart.save();
    res.status(200).json({
      message: "the cart is updated",
      cart: cart,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

// exports.postorder = async (req, res, next) => {
//   const userId = req.userId;
//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       const err = new Error("no user found");
//       err.status = 404;
//       return next(err);
//     }
//     if (user._id.toString() !== req.userId.toString()) {
//       const error = new Error("not authorized");
//       error.status = 403;
//       return next(error);
//     }
//     const cartId = user.cartId;
//     const cart = await Cart.findById(cartId);
//     if (!cart) {
//       const err = new Error("no cart found for this user");
//       err.status = 404;
//       return next(err);
//     }
//     const products = cart.items.map((item) => {
//       return { productId: item.productId, quantity: item.quantity };
//     });
//     const order = new Order({
//       products: products,
//       userId: userId,
//       orderDate: new Date(),
//     });
//     await order.save();
//     cart.items = [];
//     await cart.save();
//     user.orderIds.items.push({ orderId: order.id });
//     await user.save();
//     res.status(201).json({
//       message: "order create succsuflyy",
//       order: order,
//     });
//   } catch (err) {
//     if (!err.status) {
//       err.status = 500;
//     }
//     next(err);
//   }
// };

// exports.delteOrder = async (req, res, next) => {
//   const orderId = req.params.orderId;
//   const userId = req.userId;
//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       const err = new Error("no user found");
//       err.status = 404;
//       return next(err);
//     }
//     const order = await Order.findById(orderId);
//     if (!order) {
//       const err = new Error("no order found");
//       err.status = 404;
//       return next(err);
//     }
//     if (order.userId.toString() !== userId) {
//       const err = new Error("not authorized to delte order");
//       err.status = 403;
//       return next(err);
//     }
//     await Order.findByIdAndRemove(orderId);
//     const orderIdIndex = user.orderIds.items.findIndex((item) => {
//       return item.orderId === orderId;
//     });
//     user.orderIds.items.splice(orderIdIndex, 1);
//     await user.save();
//     res.status(200).json({
//       message: "order delted",
//     });
//   } catch (err) {
//     if (!err.status) {
//       err.status = 500;
//     }
//     next(err);
//   }
// };

exports.addToFavorites = async (req, res, next) => {
  const userId = req.userId;
  const productId = req.params.productId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId) {
      const err = new Error("not authorized ");
      err.status = 401;
      return next(err);
    }
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 404;
      return next(err);
    }
    const favorite = await Favorite.findOne({
      userId: userId,
      productId: productId,
    });
    if (favorite) {
      const err = new Error("the product is already in favorites");
      err.status = 409;
      return next(err);
    } else {
      const newFavorite = new Favorite({
        userId: userId,
        productId: productId,
      });
      await newFavorite.save();

      user.favoriteIds.items.push({ favoriteId: newFavorite.id });
      await user.save();

      await newFavorite.populate("productId");
      res.status(200).json({
        message: "the product is added to the favorites",
        favorite: newFavorite,
      });
    }
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
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId) {
      const err = new Error("not authorized ");
      err.status = 401;
      return next(err);
    }
    const favorites = await Favorite.find({ userId: userId }).populate(
      "productId"
    );
    if (!favorites) {
      const err = new Error("no favorites for this user");
      err.status = 404;
      return next(err);
    } else {
      res.status(200).json({
        message: "te favorites",
        favorites: favorites,
      });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.deleteFromFavorites = async (req, res, next) => {
  const userId = req.userId;
  const productId = req.params.productId;
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("no user found");
    err.status = 404;
    return next(err);
  }
  if (user._id.toString() !== userId) {
    const err = new Error("not authorized ");
    err.status = 401;
    return next(err);
  }
  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error("no product found");
    err.status = 404;
    return next(err);
  }

  const productInFavorite = await Favorite.findOne({
    userId: userId,
    productId: productId,
  });
  if (!productInFavorite) {
    const err = new Error(
      "this product is  not exsits for this user in favorites"
    );
    err.status = 404;
    return next(err);
  } else {
    await Favorite.findByIdAndRemove(productInFavorite.id);

    const exsistsFavoriteIndex = user.favoriteIds.items.findIndex((item) => {
      return item.favoriteId;
    });
    user.favoriteIds.items.splice(exsistsFavoriteIndex, 1);
    await user.save();

    const favorites = await Favorite.find({ userId: userId }).populate(
      "productId"
    );
    res.status(200).json({
      message: "the product is delted from favorite",
      favorites: favorites || "the favorites is empty",
    });
  }
};

exports.addRating = async (req, res, next) => {
  const productId = req.params.productId;
  const userId = req.userId;
  const ratingValue = req.body.ratingValue;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== req.userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const rate = await Rating.findOne({
      userId: userId,
      productId: productId,
    });
    if (!rate) {
      const newRate = new Rating({
        userId: userId,
        productId: productId,
        ratingValue: ratingValue,
        ratingDate: new Date(),
      });

      await newRate.save();
      user.rateIds.items.push({ rateId: newRate.id });
      await user.save();

      const numberOfRatings = await Rating.find({
        productId: productId,
      }).countDocuments();
      const ratingsForThisProduct = await Rating.find({ productId: productId });
      const ratings = ratingsForThisProduct.map((item) => {
        return item.ratingValue;
      });
      let sumOfRates = 0;
      for (const rate of ratings) {
        sumOfRates = sumOfRates + rate;
      }
      const rateProduct = sumOfRates / numberOfRatings;
      const product = await Product.findById(productId);
      if (!productId) {
        const err = new Error("no product found");
        err.status = 404;
        return next(err);
      }
      product.rate = rateProduct;
      await product.save();
      await newRate.populate("productId");

      return res.status(200).json({
        message: "the rate add succssflly",
        rate: newRate,
      });
    } else {
      rate.ratingValue = ratingValue;
      rate.ratingDate = new Date();
      await rate.save();

      const user = await User.findById(userId);
      if (!user) {
        const err = new Error("no user found");
        err.status = 404;
        return next(err);
      }

      const numberOfRatings = await Rating.find({
        productId: productId,
      }).countDocuments();
      const ratingsForThisProduct = await Rating.find({ productId: productId });
      const ratings = ratingsForThisProduct.map((item) => {
        return item.ratingValue;
      });
      let sumOfRates = 0;
      for (const rate of ratings) {
        sumOfRates = sumOfRates + rate;
      }
      const rateProduct = sumOfRates / numberOfRatings;
      const product = await Product.findById(productId);
      if (!productId) {
        const err = new Error("no product found");
        err.status = 404;
        return next(err);
      }
      product.rate = rateProduct;
      await product.save();
      await rate.populate("productId");

      res.status(200).json({
        message: "the rate add succssflly",
        rate: rate,
      });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getHistoric = async (req, res, next) => {
  const userId = req.params.userId;
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("no user found");
    err.status = 404;
    return next(err);
  }
  if (user._id.toString() !== req.userId.toString()) {
    const error = new Error("not authorized");
    error.status = 403;
    return next(error);
  }

  const history = await History.find({ userId: userId });
  if (!history) {
    const err = new Error("no history found");
    err.status = 404;
    return next(err);
  }
  res.status(200).json({
    message: "history",
    history: history,
  });
};

exports.clearHistory = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }

    const historys = await History.find({ userId: userId });
    if (!historys) {
      const err = new Error("no history for this user");
      err.status = 404;
      return next(err);
    } else {
      const historysIds = historys.map((item) => {
        return item.id;
      });
      for (const historyId of historysIds) {
        await History.findByIdAndRemove(historyId);
      }
      user.historyIds.items = [];
      await user.updateOne({ historyIds: { items: [] } });

      res.status(200).json({
        message: "the history is deleted for this user",
      });
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.addComment = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the input are invalid");
    error.status = 422;
    error.data = errors.array();
    return next(error);
  }

  const userId = req.userId;
  const productId = req.params.productId;
  const comment = req.body.comment;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no product found");
      err.status = 404;
      return next(err);
    }
    const newComment = new Comment({
      userId: userId,
      comment: comment,
      productId: product.id,
    });
    await newComment.save();
    product.commentsIds.items.push({ commentId: newComment.id });
    await product.save();
    user.commentIds.items.push({ commentId: newComment.id });
    await user.save();
    res.status(201).json({
      message: "your comment is added ",
      comment: comment,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.joinClub = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const club = await Club.findOne({ userId: userId });
    if (club) {
      const err = new Error(" you are already in the club");
      err.status = 409;
      return next(err);
    }
    const newClub = new Club({
      userId: userId,
    });
    await newClub.save();
    user.isMemberClub = true;
    await user.save();
    res.status(201).json({
      message: "you joined club succssuflyy",
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.leaveClub = async (req, res, next) => {
  const userId = req.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }
    const club = await Club.findOne({ userId: userId });
    if (!club) {
      const err = new Error("you are not member at club");
      err.status = 404;
      return next(err);
    }
    await Club.findByIdAndRemove(club.id);
    user.isMemberClub = false;
    await user.save();
    res.status(200).json({ message: "you leaved the club" });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.createInvoice = async (req, res, next) => {
  const userId = req.userId;
  const orderId = req.params.orderId;
  try {
    const user = await User.findById(userId).populate(
      "invoiceIds.items.invoiceId"
    );
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    if (user._id.toString() !== userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      return next(error);
    }

    const order = await Order.findById(orderId).populate("userId");
    if (!order) {
      const err = new Error("No order found");
      err.status = 404;
      throw err;
    }

    const doc = new PDFDocument({ margin: 50 });

    const headerFontSize = 18;
    const subheaderFontSize = 14;

    doc
      .font("Helvetica-Bold")
      .fontSize(headerFontSize)
      .text("Order Invoice", { align: "center" });

    doc.moveDown();
    doc.font("Helvetica").fontSize(subheaderFontSize);

    const date = new Date(order.orderDate);
    const formattedDate = date.toLocaleString("EN-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    doc.text("Customer :  " + order.userId.name, { align: "left" });
    doc.text("Date     :  " + formattedDate, { align: "left" });
    doc.text("Order Status :  " + order.orderstatus, { align: "left" });
    doc.moveDown();

    doc.font("Helvetica-Bold");
    doc.text("PRODUCT", 110, 256, { width: 190 });
    doc.text("QUANTITY", 300, 256, { width: 100 });
    doc.text("PRICE", 400, 256, { width: 100 });
    doc.text("TOTAL PRICE", 500, 256, { width: 100 });
    doc.font("Helvetica");

    let productNo = 1;
    const products = order.products;
    for (const product of products) {
      let y = 256 + productNo * 20;
      const productDatabase = await Product.findById(product.productId);
      doc.text(productDatabase.name, 110, y, { width: 190 });
      doc.text(product.quantity, 300, y, { width: 100 });
      const totalePrice = productDatabase.price * product.quantity;
      doc.text(productDatabase.price, 400, y, { width: 100 });
      doc.text(totalePrice, 500, y, { width: 100 });
      productNo++;
      doc.moveDown();
    }

    let totalAmount = 0;
    for (const product of products) {
      const productDatabase = await Product.findById(product.productId);
      totalAmount = totalAmount + product.quantity * productDatabase.price;
    }

    doc.moveDown();
    doc
      .font("Helvetica-Bold")
      .fontSize(subheaderFontSize)
      .text("Total:", { align: "right" });
    doc.text("$" + totalAmount.toFixed(2), { align: "right" });

    doc.pipe(
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",
          folder: "invoices",
          public_id:
            "invoice-" + userId + "-" + new Date().toISOString() + "-" + ".pdf",
        },
        async (error, result) => {
          if (error) {
            console.error("Error uploading invoice to Cloudinary:", error);
          } else {
            console.log("Invoice uploaded to Cloudinary:", result.url);
            const newInvoice = new Invoice({
              userId: userId,
              invoiceUrl: result.url,
            });
            await newInvoice.save();
            user.invoiceIds.items.push({ invoiceId: newInvoice.id });
            await user.save();
            return res.status(201).json({
              message: "the invoice is created",
              invoiceUrl: result.url,
            });
          }
        }
      )
    );

    doc.end();
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

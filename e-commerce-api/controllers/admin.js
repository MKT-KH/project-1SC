const path = require("path");

cloudinary = require("cloudinary");

const Product = require("../models/product");
const Order = require("../models/order");

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

exports.getOrders = async (req, res, next) => {
  const orders = await Order.find();
  if (!orders) {
    const err = new Error("no orders found");
    err.status = 404;
    return next(err);
  }
  res.status(200).json({
    message: "orders",
    orders: orders,
  });
};

exports.getStatisticsAboutOrders = async (req, res, next) => {
  let totalPrice = 0;
  let totalPriceForShippedOrders = 0;
  let totalPriceForActiveOrders = 0;
  const totalOrders = await Order.find().countDocuments();
  const orders = await Order.find();
  const products = orders.map((item) => {
    return item.products;
  });

  for (const item of products) {
    for (const item2 of item) {
      const product = await Product.findById(item2.productId);
      const totalPriceOfProduct = product.price * item2.quantity;
      totalPrice = totalPrice + totalPriceOfProduct;
    }
  }

  const shipedOrdersNumber = await Order.findOne({
    Orderstatus: "shipped",
  }).countDocuments();

  const shippedOrders = await Order.find({ Orderstatus: "shipped" });

  const productsOfShippedOrders = shippedOrders.map((item) => {
    return item.products;
  });

  for (const item of productsOfShippedOrders) {
    for (const item2 of item) {
      const product = await Product.findById(item2.productId);
      const totalPriceOfProduct = product.price * item2.quantity;
      totalPriceForShippedOrders =
        totalPriceForShippedOrders + totalPriceOfProduct;
    }
  }

  const activeOrderNumber = await Order.find().countDocuments();

  const activedOrders = await Order.find({ Orderstatus: "shipped" });

  const productsOfActiveOrders = activedOrders.map((item) => {
    return item.products;
  });

  for (const item of productsOfActiveOrders) {
    for (const item2 of item) {
      const product = await Product.findById(item2.productId);
      const totalPriceOfProduct = product.price * item2.quantity;
      totalPriceForActiveOrders =
        totalPriceForActiveOrders + totalPriceOfProduct;
    }
  }

  res.status(200).json({
    message: "the total orders",
    totalOrders: totalOrders,
    message2: "the amount price for orders",
    totalPrice: totalPrice,
    message3: "the shiped order number",
    shipedOrdersNumber: shipedOrdersNumber,
    message4: "the amount price for shippedOrders",
    totalPriceForShippedOrders: totalPriceForShippedOrders,
    message5: "the amount price for active orders",
    totalPriceForActiveOrders: totalPriceForActiveOrders,
    message6: "the active ordernumber",
    activeOrderNumber: activeOrderNumber,
  });
};

exports.getStatisticsAboutOrdersPrice = async (req, res, next) => {
  const shippedOrders = await Order.find({ Orderstatus: "delivred" });
  let totalPriceByMonth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (const order of shippedOrders) {
    const date = new Date(order.orderDate);
    const month = date.getMonth();
    const products = order.products;

    for (const item of products) {
      const product = await Product.findById(item.productId);
      const totalPriceOfProduct = product.price * item.quantity;
      totalPriceByMonth[month] += totalPriceOfProduct;
    }
  }

  const statistics = {
    January: totalPriceByMonth[0],
    February: totalPriceByMonth[1],
    March: totalPriceByMonth[2],
    April: totalPriceByMonth[3],
    May: totalPriceByMonth[4],
    June: totalPriceByMonth[5],
    July: totalPriceByMonth[6],
    August: totalPriceByMonth[7],
    September: totalPriceByMonth[8],
    October: totalPriceByMonth[9],
    November: totalPriceByMonth[10],
    December: totalPriceByMonth[11],
  };

  res.status(200).json({
    message: "the amount for every month",
    statistics,
  });
};

const path = require("path");
const { validationResult } = require("express-validator/check");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const cloudinary = require("cloudinary").v2;

const Product = require("../models/product");
const Order = require("../models/order");
const User = require("../models/user");
const Role = require("../models/role");
const Club = require("../models/club");

const transport = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API,
    },
  })
);

const roleForProducts = "product management";
const roleForUsers = "users management";
const roleForOrders = "orders management";
const roleForStatistics = "statistics management";
const roleForSuperAdmin = "superAdmin";
//{
//  "adminRoles": ["superAdmin", "product management", "users management", "orders management", "statistics management"]
//}

exports.createProduct = async (req, res, next) => {
  const name = req.body.name;
  const price = req.body.price;
  const type = req.body.type;
  const quantity = req.body.quantity;
  const colors = req.body.colors;
  const description = req.body.description;
  const images = req.files.map((file) => file.path);
  try {
    await permission(req.userId, roleForSuperAdmin, roleForProducts);

    const exsitsProduct = await Product.findOne({ name: name });
    if (exsitsProduct) {
      const error = new Error("the product is aleardy exsits");
      error.status = 409;
      return next(error);
    }

    const product = new Product({
      name: name,
      type: type,
      price: price,
      quantity: quantity,
      imageUrl: images,
      colors: colors,
      description: description,
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
    await permission(req.userId, roleForSuperAdmin, roleForProducts);
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
    const description = req.body.description;
    const images = req.files.map((file) => file.path);

    product.name = name;
    product.price = price;
    product.type = type;
    product.quantity = quantity;
    product.description = description;
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
    await permission(req.userId, roleForSuperAdmin, roleForProducts);

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
  try {
    await permission(req.userId, roleForSuperAdmin, roleForOrders);

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
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getStatisticsAboutOrders = async (req, res, next) => {
  try {
    await permission(req.userId, roleForSuperAdmin, roleForStatistics);

    let totalPrice = 0;
    let totalPriceForShippedOrders = 0;
    let totalPriceForActiveOrders = 0;
    const totalOrders = await Order.find().countDocuments();
    const orders = await Order.find();
    const products = orders.map((item) => {
      return item.products;
    });

    for (const item of products) {
      for (const secondItem of item) {
        const product = await Product.findById(secondItem.productId);
        if (!product) {
          const err = new Error(
            `no product found in data base for this product ${secondItem.productId}`
          );
          err.status = 404;
          return next(err);
        }
        const totalPriceOfProduct = product.price * secondItem.quantity;
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
      for (const secondItem of item) {
        const product = await Product.findById(secondItem.productId);
        if (!product) {
          const err = new Error(
            `no product found in data base for this product ${secondItem.productId}`
          );
          err.status = 404;
          return next(err);
        }
        const totalPriceOfProduct = product.price * secondItem.quantity;
        totalPriceForShippedOrders =
          totalPriceForShippedOrders + totalPriceOfProduct;
      }
    }

    const activeOrderNumber = await Order.find({
      Orderstatus: "active",
    }).countDocuments();

    const activedOrders = await Order.find({ Orderstatus: "active" });

    const productsOfActiveOrders = activedOrders.map((item) => {
      return item.products;
    });

    for (const item of productsOfActiveOrders) {
      for (const secondItem of item) {
        const product = await Product.findById(secondItem.productId);
        if (!product) {
          const err = new Error(
            `no product found in data base for this product ${secondItem.productId}`
          );
          err.status = 404;
          return next(err);
        }
        const totalPriceOfProduct = product.price * secondItem.quantity;
        totalPriceForActiveOrders =
          totalPriceForActiveOrders + totalPriceOfProduct;
      }
    }

    const fiveOrdersRecents = await Order.find()
      .sort({ orderDate: -1 })
      .limit(5);
    let usersIdsandOrders = [];
    for (const order of fiveOrdersRecents) {
      const user = await User.findById(order.userId);
      if (!user) {
        const err = new Error(" no user found");
        err.status = 404;
        return next(err);
      }
      usersIdsandOrders.push({
        orderId: order.id,
        userId: order.userId,
        orderStaus: order.orderstatus,
      });
    }
    let userSNameAndOrdersId = [];
    for (const user2 of usersIdsandOrders) {
      const user = await User.findById(user2.userId);
      if (!user) {
        const err = new Error(" no user found");
        err.status = 404;
        return next(err);
      }
      userSNameAndOrdersId.push({
        orderId: user2.orderId,
        userName: user.name,
        orderStatus: user2.orderStaus,
      });
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
      message7: "the 5 resentes orders info ",
      fiveOrdersRecents: userSNameAndOrdersId,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getStatisticsAboutOrdersPrice = async (req, res, next) => {
  try {
    await permission(req.userId, roleForSuperAdmin, roleForOrders);
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
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.changeEtatOrder = async (req, res, next) => {
  try {
    await permission(req.userId, roleForSuperAdmin, roleForOrders);

    const orderId = req.params.orderId;
    const orderStatus = req.body.orderStatus;
    const order = await Order.findById(orderId);
    order.orderstatus = orderStatus;
    await order.save();

    const products = order.products;

    if (order.orderstatus === "delivred") {
      for (const product of products) {
        const prod = await Product.findById(product.productId);
        prod.quantity = prod.quantity - product.quantity;
        if (prod.quantity < 0) {
          prod.quantity = 0;
        }
        let productsSales = 0;
        prod.sales = productsSales + product.quantity;
        await prod.save();
      }
    }
    res.status(200).json({
      message: "the orderStatus is updated",
      order: order,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getInformationABoutProducts = async (req, res, next) => {
  // let productsInfo = [];

  // const orders = await Order.find({ orderstatus: "delivred" });
  // const products = orders
  //   .map((item) => {
  //     return item.products;
  //   })
  //   .flat();

  // for (const product of products) {
  //   const prod = await Product.findById(product.productId);
  //   let productsSales = 0;
  //   productsSales = productsSales + product.quantity;
  //   let remainingProducts = 0;
  //   remainingProducts = prod.quantity - product.quantity;
  //   productsInfo.push({
  //     productName: { prod },
  //     productsSales: productsSales,
  //     remainingProducts: remainingProducts,
  //   });
  //
  // }
  try {
    await permission(req.userId, roleForSuperAdmin, roleForProducts);
    const products = await Product.find();

    res.status(200).json({
      message: "the products",
      products: products,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getProductsForType = async (req, res, next) => {
  const type = req.params.type;
  try {
    await permission(req.userId, roleForSuperAdmin, roleForProducts);
    const products = await Product.find({ type: type });
    if (products.length < 1) {
      const err = new Error(`no products found for this ${type}`);
      err.status = 404;
      return next(err);
    }
    res.status(200).json({
      message: `the products for ${type} type are : `,
      products: products,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    // await permission(req.userId, roleForSuperAdmin, roleForUsers);
    const users = await User.find().populate("roleIds.items.roleId");
    res.status(200).json({
      message: "users",
      users: users,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.ChangeEtatUser = async (req, res, next) => {
  const userId = req.params.userId;
  const userEtat = req.body.etat;
  try {
    await permission(req.userId, roleForSuperAdmin, roleForUsers);

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      return next(error);
    }

    if (userEtat === "true") {
      if (user.Blacklisted === false) {
        user.Blacklisted = userEtat;
        await user.save();
        return res.status(200).json({
          message: "the user is blocked",
          user: user,
        });
      } else {
        const err = new Error("the user is already blocked");
        err.status = 409;
        return next(err);
      }
    } else if (userEtat === "false") {
      if (user.Blacklisted === true) {
        user.Blacklisted = userEtat;
        await user.save();
        return res.status(200).json({
          message: "the user is deblocked",
          user: user,
        });
      } else {
        const err = new Error("the user is already deblocked");
        err.status = 409;
        return next(err);
      }
    }
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.createAdmin = async (req, res, next) => {
  const userId = req.params.userId;
  const adminRoles = req.body.adminRoles;

  try {
    await permission(req.userId, roleForSuperAdmin);
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const roles = await Role.find({ userId: userId });
    if (roles) {
      for (const role of roles) {
        for (let i = 0; i < adminRoles.length; i++) {
          if (role.role === adminRoles[i]) {
            const err = new Error(
              `this admin is alredy have ${role.role} role`
            );
            err.status = 404;
            return next(err);
          }
        }
      }
    }
    for (const item of adminRoles) {
      const role = new Role({
        userId: userId,
        role: item,
      });

      await role.save();
      user.isAdmin = true;
      user.roleIds.items.push({ roleId: role.id });
      await user.save();
    }

    res.status(200).json({
      message: "the admin is created succesflyy",
      admin: user,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.addDiscount = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the input are invalid");
    error.status = 422;
    error.data = errors.array();
    return next(error);
  }
  const productId = req.params.productId;
  const discount = req.body.discount;
  try {
    await permission(req.userId, roleForSuperAdmin, roleForProducts);
    const product = await Product.findById(productId);
    if (!product) {
      const err = new Error("no prodcuct found");
      err.status = 404;
      return next(err);
    }
    product.discount = discount;
    await product.save();
    const club = await Club.find().populate("userId");
    for (const memberOfClub of club) {
      transport.sendMail({
        to: memberOfClub.userId.email,
        from: process.env.SENDER_EMAIL,
        subject: `Exclusive deal: ${product.discount}% off ${product.name}!`,
        html: `
        <html>
        <head>
          <style>
            .container {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              box-sizing: border-box;
              font-family: Arial, sans-serif;
              font-size: 16px;
              line-height: 1.5;
              color: #333;
            }
            
            h1 {
              margin-top: 0;
              margin-bottom: 20px;
              text-align: center;
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            
            p {
              margin-top: 0;
              margin-bottom: 20px;
            }
            
            img {
              display: block;
              margin: 0 auto;
              max-width: 100%;
              height: auto;
            }
            
            .product-name {
              font-weight: bold;
            }
            
            .discount {
              color: #ff5733;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Product Discount</h1>
            <p>Dear User,</p>
            <p>We wanted to let you know that one of our products is currently on sale! Take advantage of this limited time offer by visiting our website and placing an order today.</p>
            <p><img src="${product.imageUrl[0]}" alt="[Product Image]"></p>
            <p>Product Name: <span class="product-name">${product.name}</span></p>
            <p>Discount: <span class="discount">${product.discount}% off</span></p>
            <p>Thank you for being a valued customer!</p>
            <p>Sincerely,</p>
            <p>The ByteBuilders Team</p>
          </div>
        </body>
      </html>
`,
      });
    }

    res.status(200).json({
      message: "the discount added",
      product: product,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

const permission = async (userId, ...roles) => {
  const rolesForAdmin = await Role.find({ userId: userId });
  const theRolesForAdmin = rolesForAdmin.map((item) => {
    return item.role;
  });

  const existRoles = roles.some((role) => theRolesForAdmin.includes(role));
  if (!existRoles) {
    const err = new Error("This admin is not permitted to do this task");
    err.status = 403;
    throw err;
  }
};

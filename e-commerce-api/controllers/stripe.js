const Product = require("../models/product");
const User = require("../models/user");
const order = require("../models/order");
const Cart = require("../models/cart");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

exports.createCheckoutSession = async (req, res, next) => {
  const userID = req.userId;
  const stripeitem = [];
  const user = await User.findById(userID);
  const cart = await Cart.findById(user.cartId);

  const customer = await stripe.customers.create({
    name: user.name,
    email: user.email,
    metadata: {
      customer_id: userID,
      registration_date: new Date(),
    },
    shipping: {
      name: user.name,
      address: {
        line1: req.body.address,
      },
    },
  });

  const getStripeItems = async (cb) => {
    for (const item of cart.items) {
      let storeItem = await Product.findById(item.productId);

      stripeitem.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: storeItem.name,
          },
          unit_amount: storeItem.price * 100,
        },
        quantity: item.quantity,
      });
      storeItem.quantity = storeItem.quantity - 1;
      await storeItem.save();
    }
    cb(stripeitem);
  };

  getStripeItems(async (lineitems) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: lineitems,
        customer: customer.id,
        success_url: "http://localhost:3000//MyOrders",
        cancel_url: "http://localhost:3000/",
      });

      res.json({ url: session.url });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
};

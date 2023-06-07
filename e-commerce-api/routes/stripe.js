const express = require("express");
const User = require("../models/user");
const Order = require("../models/order");
const Cart = require("../models/cart");
const stripeControllers = require("../controllers/stripe");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);
const bodyParser = require("body-parser");
const isAuth = require("../middleware/is-auth");
const postOrder = async (userID, addressShipping) => {
  const userId = userID;
  try {
    const user = await User.findById(userId);
    if (!user) {
      const err = new Error("no user found");
      err.status = 404;
      return next(err);
    }
    const cartId = user.cartId;
    const cart = await Cart.findById(cartId);
    if (!cart) {
      const err = new Error("no cart found for this user");
      err.status = 404;
      return next(err);
    }
    const products = cart.items.map((item) => {
      return { productId: item.productId, quantity: item.quantity };
    });
    const order = new Order({
      products: products,
      userId: userId,
      orderDate: new Date(),
      orderAdress: addressShipping,
    });
    await order.save();
    cart.items = [];
    user.orderIds.items.push(order.id);
    await user.save();
    await cart.save();
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
  }
};

// This is your Stripe CLI webhook secret for testing your endpoint locally.
const endpointSecret = process.env.ENDPOINT_PRIVATE;

router.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (request, response, next) => {
    const payload = request.body;
    const sig = request.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        payload.toString(),
        sig,
        endpointSecret
      );
    } catch (err) {
      console.log("webhook errr " + err.message);
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        const customer = await stripe.customers.retrieve(session.customer);
        // Then define and call a function to handle the event payment_intent.succeeded
        postOrder(
          customer.metadata.customer_id,
          customer.shipping.address.line1
        );

        break;
      // ... handle other event types
      default:
    }

    // Return a 200 response to acknowledge receipt of the event
    response.send().end();
  }
);

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post(
  "/create-checkout-session",
  isAuth,
  stripeControllers.createCheckoutSession
);

module.exports = router;

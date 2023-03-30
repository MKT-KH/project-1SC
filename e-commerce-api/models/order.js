const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const orderSchema = new Schema({
  products: [
    {
      productId: {
        type: mongoose.Types.ObjectId,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "user",
  },
  Orderstatus: {
    type: String,
    required: true,
  },
  orderDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
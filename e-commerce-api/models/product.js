const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  //qty
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  colors: [
    {
      type: String,
      required: true,
    },
  ],
  type: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  imageUrl: [
    {
      type: String,
      required: true,
    },
  ],
  sales: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("Product", ProductSchema);

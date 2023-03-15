const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  // price: {
  //   type: Float,
  //   required: true,
  // },
  color: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("product", ProductSchema);

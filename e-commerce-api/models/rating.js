const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const rateSchema = new Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
  ratingDate: {
    type: Date,
    required: true,
  },
  ratingValue: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Rating", rateSchema);

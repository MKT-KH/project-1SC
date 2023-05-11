const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const historySchema = new Schema({
  action: {
    type: String,
    required: true,
  },
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
  date: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("History", historySchema);

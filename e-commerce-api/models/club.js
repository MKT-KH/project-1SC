const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const clubSchema = new Schema({
  userId: {
    type: mongoose.Types.ObjectId,
    required: true,
    ref: "User",
  },
});

module.exports = mongoose.model("Club", clubSchema);

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: false,
  },
  verify: {
    type: Boolean,
    default: false,
  },
  token: String,
  expiresToken: Date,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  imageUrl: {
    type: String,
  },
  address: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("User", UserSchema);

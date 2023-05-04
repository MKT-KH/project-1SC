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
  },
  phoneNumber: {
    type: String,
  },
  orderIds: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
          //required: true,
        },
      },
    ],
  },
  favorites: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
  },
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        totalePrice: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  adminRoles: {
    roles: [
      {
        type: String,
      },
    ],
  },
  Blacklisted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSchema);

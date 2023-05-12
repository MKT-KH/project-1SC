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
  Blacklisted: {
    type: Boolean,
    default: false,
  },
  cartId: {
    type: Schema.Types.ObjectId,
    ref: "Cart",
  },
  orderIds: {
    items: [
      {
        orderId: {
          type: Schema.Types.ObjectId,
          ref: "Order",
          required: true,
        },
      },
    ],
  },
  rateIds: {
    items: [
      {
        rateId: {
          type: Schema.Types.ObjectId,
          ref: "Rating",
          required: true,
        },
      },
    ],
  },
  historyIds: {
    items: [
      {
        historyId: {
          type: Schema.Types.ObjectId,
          ref: "History",
          required: true,
        },
      },
    ],
  },
  roleIds: {
    items: [
      {
        roleId: {
          type: Schema.Types.ObjectId,
          ref: "Role",
          required: true,
        },
      },
    ],
  },
  favoriteIds: {
    items: [
      {
        favoriteId: {
          type: Schema.Types.ObjectId,
          ref: "Favorite",
          required: true,
        },
      },
    ],
  },
  invoiceIds: {
    items: [
      {
        invoiceId: {
          type: Schema.Types.ObjectId,
          ref: "Invoice",
          required: true,
        },
      },
    ],
  },
  commentIds: {
    items: [
      {
        commentId: {
          type: Schema.Types.ObjectId,
          ref: "Comment",
          required: true,
        },
      },
    ],
  },
  isMemberClub: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", UserSchema);

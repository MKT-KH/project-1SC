const User = require("../models/user");

module.exports = async (req, res, next) => {
  const user = await User.findOne({ _id: req.userId });
  if (!user.isAdmin) {
    const error = new Error("admin authorization");
    error.status = 401;
    next(error);
  }
  next();
};

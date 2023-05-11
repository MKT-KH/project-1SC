const User = require("../models/user");

module.exports = async (req, res, next) => {
  const user = await User.findById(req.userId);
  if (!user) {
    const error = new Error("no admin found");
    error.status = 404;
    next(error);
  }
  if (!user.isAdmin) {
    const error = new Error("admin authorization you are not admin");
    error.status = 401;
    next(error);
  }

  next();
};

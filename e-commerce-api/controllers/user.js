const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");

const User = require("../models/user");

exports.editUser = async (req, res, next) => {
  const updatedName = req.body.updatedName;
  const updatedEmail = req.body.updatedEmail;
  const updatedAdress = req.body.updatedAdress;
  const updatedPassword = req.body.updatedPassword;
  const updatedPhone = req.body.updatedPhone;
  const image = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the input are invalid");
    error.status = 422;
    error.data = errors.array();
    next(error);
  }

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      throw error;
    }

    if (user._id.toString() !== req.userId.toString()) {
      const error = new Error("not authorized");
      error.status = 403;
      next(error);
    }
    const exsistUser = await User.findOne({ email: updatedEmail });
    if (exsistUser) {
      const error = new Error(
        "the email is alerdy in use please take nother email"
      );
      error.status = 403;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(updatedPassword, 12);
    user.name = updatedName;
    user.email = updatedEmail;
    user.password = hashedPassword;
    user.phoneNumber = updatedPhone;
    user.address = updatedPassword;
    user.address = updatedAdress;

    if (image) {
      clearImage(user.imageUrl);
      user.imageUrl = image.path;
    }

    await user.save();
    res.status(200).json({
      message: "the user is upated",
      userId: req.userId,
    });
  } catch (err) {
    err.status = 500;
    next(err);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (err) => console.log(err));
};

const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator/check");

const User = require("../models/user");

const transport = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: process.env.SENDGRID_API,
    },
  })
);

exports.signUp = async (req, res, next) => {
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const confirmedPassword = req.body.confirmedPassword;
  const phone = req.body.phone;
  const address = req.body.address;
  const image = req.file;

  if (!image) {
    const error = new Error("no image is attached");
    error.status = 422;
    next(error);
    // return res.status(422).json({
    //   message: "no image is attached",
    // });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the input are invalid");
    error.status = 422;
    error.data = errors.array();
    next(error);
  }

  if (password !== confirmedPassword) {
    const error = new Error("the 2 password are not matched");
    error.status = 403;
    next(error);
    // return res.status(403).json({
    //   message: "the 2 password are not matched",
    // });
  }

  try {
    let user = await User.findOne({ email: email });
    if (user) {
      const error = new Error("the user is alerdy exists");
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      imageUrl: "/" + image.path,
      phoneNumber: phone,
      address: address,
    });
    await user.save();

    transport.sendMail({
      to: user.email,
      from: "m.khelladi@esi-sba.dz",
      subject: "Create account succsufuly",
      html: `<h2> verify that you create account by click this link <h2/>
            <a href="http://localhost:3001/auth/verify/${user._id}"> Verify </a>
            `,
    });
    res.status(201).json({
      message: "user created sucsuffyly without verification",
      userId: user._id,
      verify: user.verify,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  const userId = req.params.userId;
  try {
    let user = await User.findById(userId);
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      throw error;
    }
    user.verify = true;
    await user.save();
    res.status(200).json({
      message: "the account is activated",
      userId: userId,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      throw error;
    }
    if (!user.verify) {
      const error = new Error("the account is not activated");
      next(error);
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("the password is incorecct");
      error.status = 404;
      throw error;
    }
    const token = jwt.sign({ email: email, userId: user._id }, "topsecertkey", {
      expiresIn: "1h",
    });
    res.status(200).json({
      token: token,
      message: "the user is loged in",
      userId: user.userId,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.tokenForgetPassword = async (req, res, next) => {
  const email = req.body.email;
  let token;
  try {
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console0.log(err);
      }
      token = buffer.toString("hex");
    });

    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      throw error;
    }
    user.token = token;
    user.expiresToken = Date.now() + 360000;
    await user.save();
    transport.sendMail({
      to: user.email,
      from: "m.khelladi@esi-sba.dz",
      subject: "Reset Password",
      html: `
          <h2> Click this link to reset your password </h2>
          <a href ="http://localhost:3001/auth/reset/form/${token}"> the Link </a>
          `,
    });
    res.status(200).json({
      message: "the email for restpassword is delivreid",
      userId: user._id,
      token: token,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.getForm = async (req, res, next) => {
  const token = req.params.token;
  const user = await User.findOne({ token: token });
  if (!user) {
    const error = new Error("no user found for this token");
    error.status = 404;
    throw error;
  }

  res.send(`<h2> Reset your password from this link  <h2/>
     <form method="post" action="http://localhost:3001/auth/reset/${token}">
       <input name="password">  </input>
       <button type="submit"> reset <button>
     </form>
   `);
};

exports.resetPassword = async (req, res, next) => {
  const token = req.params.token;
  const password = req.body.password;
  try {
    const user = await User.findOne({ token: token });
    if (!user) {
      const error = new Error("no user found ");
      error.status = 404;
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    user.token = "";
    await user.save();
    res.status(201).json({
      message: "the password is updated",
      userId: user._id,
    });
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    next(err);
  }
};

exports.signInGoogle = (req, res, next) => {
  const token = jwt.sign({ user: req.user }, process.env.TOKEN_SECERT_KEY, {
    expiresIn: "1h",
  });
  res.json({
    message: "the token for authentification",
    token: token,
  });
};

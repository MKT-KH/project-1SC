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
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the input are invalid");
    error.status = 422;
    error.data = errors.array();
    return next(error);
  }

  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  const confirmedPassword = req.body.confirmedPassword;
  const phone = req.body.phone;
  const address = req.body.address;

  if (password !== confirmedPassword) {
    const error = new Error("the 2 password are not matched");
    error.status = 403;
    return next(error);
  }

  try {
    let user = await User.findOne({ email: email });
    if (user) {
      const error = new Error("the user is alerdy exists");
      error.status = 409;
      return next(error);
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    user = new User({
      name: name,
      email: email,
      password: hashedPassword,
      phoneNumber: phone,
      address: address,
    });
    await user.save();

    transport.sendMail({
      to: user.email,
      from: process.env.SENDER_EMAIL,
      subject: "Create account succsufuly",
      html: `<h2> verify that you create account by click this link <h2/>
            <a href="http://localhost:3001/auth/verify/${user._id}"> Verify </a>
            `,
    });
    res.status(201).json({
      message: "user created sucsuffyly without verification",
      user: user,
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
      return next(error);
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
      return next(error);
    }
    if (!user.verify) {
      const error = new Error("the account is not activated");
      return next(error);
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("the password is incorecct");
      error.status = 404;
      return next(error);
    }
    const token = jwt.sign(
      { email: email, userId: user._id },
      process.env.TOKEN_SECERT_KEY,
      {
        expiresIn: "1h",
      }
    );
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
        console.log(err);
      }
      token = buffer.toString("hex");
    });

    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("no user found");
      error.status = 404;
      return next(error);
    }
    user.token = token;
    user.expiresToken = Date.now() + 360000;
    await user.save();
    transport.sendMail({
      to: user.email,
      from: process.env.SENDER_EMAIL,
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
    return next(error);
  }

  res.send(`<h2> Reset your password from this link  <h2/>
     <form method="post" action="http://localhost:3001/auth/reset/${token}">
       <input type="password" name="password">  </input>
       <input type="password" name="confiremedPassword">  </input>
       <button type="submit"> reset <button>
     </form>
   `);
};

exports.resetPassword = async (req, res, next) => {
  const token = req.params.token;
  const password = req.body.password;
  const confiremedPassword = req.body.confiremedPassword;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the input are invalid");
    error.status = 422;
    error.data = errors.array();
    return next(error);
  }

  if (password !== confiremedPassword) {
    const error = new Error("the passwords are not matched");
    error.status = 422;
    return next(error);
  }

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
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });
  res.status(200).json({
    message: "the token for authentification",
    token: token,
  });
};

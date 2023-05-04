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
      subject: "Please Verify Your Account",
      html: `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>

              body {
                background-color: #f6f6f6;
                font-family: Arial, sans-serif;
                font-size: 16px;
                line-height: 1.4;
                color: #444444;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
              }
              h1 {
                color: #333333;
                font-size: 28px;
                font-weight: bold;
                margin-top: 0;
                margin-bottom: 20px;
              }
              p {
                margin-bottom: 20px;
              }
              .center {
                text-align: center;
              }
              a {
                display: inline-block;
                background-color: #007bff;
                color: #ffffff;
                font-size: 16px;
                font-weight: bold;
                text-decoration: none;
                padding: 12px 24px;
                border-radius: 4px;
              }
              a:hover {
                background-color: #0062cc;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Verify Your Account</h1>
              <p>Thank you for signing up! To activate your account and start using our services, please click the button below to verify your email address.</p>
              <p class="center"><a href="http://localhost:3001/auth/verify/${user._id}">Verify Account</a></p>
              <p>If you didn't create an account with us, please ignore this message.</p>
            </div>
          </body>
        </html>
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
    if (user.Blacklisted) {
      const error = new Error("you are blocked try later");
      error.status = 403;
      return next(error);
    }
    const token = jwt.sign(
      { email: email, userId: user._id },
      process.env.TOKEN_SECERT_KEY,
      {
        expiresIn: "4h",
      }
    );
    res.cookie("authToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    res.status(200).json({
      token: token,
      message: "the user is loged in",
      user: user,
      userId: user._id,
      isAdmin: user.isAdmin,
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
      subject: "Password Reset - Techmate.store.dz",
      html: `
          <div style="background-color: #f5f5f5; padding: 40px; text-align: center;">
              <h1 style="font-size: 24px;">Password Reset</h1>
              <p style="font-size: 16px; line-height: 1.5;">Dear ${user.name},</p>
              <p style="font-size: 16px; line-height: 1.5;">You recently requested to reset your password on Techmate.store.dz . Please click the button below to proceed:</p>
              <table cellpadding="0" cellspacing="0" border="0" align="center">
                  <tr>
                      <td style="padding: 16px 32px; background-color: #2196f3; border-radius: 6px;">
                          <a href="http://localhost:3001/auth/reset/form/${token}" style="color: #fff; text-decoration: none; font-size: 16px;">Reset Password</a>
                      </td>
                  </tr>
              </table>
              <p style="font-size: 16px; line-height: 1.5; margin-top: 40px;">If you did not request a password reset, please ignore this email.</p>
          </div>
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
  res.render("resetPassword");
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

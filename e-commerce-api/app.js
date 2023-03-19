const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const mongoose = require("mongoose");
const dotenv = require("dotenv").config();
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const User = require("./models/user");
const Product = require("./models/product");

const app = express();

const fileStorageProducts = multer.diskStorage({
  destination: async (req, file, cb) => {
    const name = req.body.name;
    const product = await Product.findOne({ name: name });
    if (product) {
      const error = new Error("The product already exists");
      error.status = 409;
      cb(error);
    } else {
      cb(null, "data/productImages");
    }
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileStorageUsers = multer.diskStorage({
  destination: async (req, file, cb) => {
    const email = req.body.email;
    const user = await User.findOne({ email: email });
    if (user) {
      const error = new Error("The user already exists");
      error.status = 409;
      cb(error);
    } else {
      cb(null, "data/profileImages");
    }
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const store = new MongoDBStore({
  uri: `mongodb+srv://${process.env.MONGO_DB_NAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.njaiivm.mongodb.net/${process.env.MONGO_DB_DEFAULT}`,
  collection: "sessions",
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  "/admin",
  multer({
    fileFilter: fileFilter,
    storage: fileStorageProducts,
  }).array("images", 5)
);
app.use(
  "/auth",
  multer({
    storage: fileStorageUsers,
    fileFilter: fileFilter,
  }).single("image")
);

//app.use("/images", express.static(path.join(__dirname, "images")));
app.use((req, res, next) => {
  //CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,DELETE,PUT,PATCH,POST");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type ,Authorization");
  next();
});
app.use(
  session({
    secret: "mysecret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use("/auth", authRoutes);
app.use("/product", shopRoutes);
app.use("/admin", adminRoutes);
app.use("/user", userRoutes);

app.use((req, res, next) => {
  const error = new Error("resource not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const status = error.status;
  const message = error.message;
  res.status(status || 500).json({
    message: message,
    err: error.data,
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_DB_NAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.njaiivm.mongodb.net/${process.env.MONGO_DB_DEFAULT}?retryWrites=true&w=majority`
  )
  .then((result) => {
    const port = process.env.PORT || 3001;
    console.log(`the server is listen in port ${port}`);
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });

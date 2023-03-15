const path = require("path");
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

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "data/profileImages");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimeType === "image/jpeg" ||
    file.mimeType === "image/jpg"
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
  multer({
    fileFilter: fileFilter,
    storage: fileStorage,
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

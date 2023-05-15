const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  api_key: process.env.CLOUDIANRY_API_KEY,
  api_secret: process.env.CLOUDIANRY_SECRET_KEY,
  cloud_name: process.env.CLOUDIANRY_CLOUD_NAME,
});

exports.storageProfileImages = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profileImages",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: (req, file) => {
      return new Date().toISOString() + "-" + file.originalname;
    },
  },
});

exports.storageProductImages = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "productImages",
    allowed_formats: ["jpg", "png", "jpeg"],
    public_id: (req, file) => {
      return new Date().toISOString() + "-" + file.originalname;
    },
  },
});

exports.storageInvoices = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "invoicePdfs",
    allowed_formats: ["pdf"],
    public_id: (req, file) => {
      return new Date().toISOString() + "-" + file.originalname;
    },
  },
});

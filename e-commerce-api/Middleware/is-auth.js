const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token = req.get("Authorization").split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.TOKEN_SECERT_KEY);
  } catch (err) {
    err.status = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("not authenticated ");
    error.status = 401;
    throw error;
  }
  req.userId = decodedToken.userId; // authorized
  next();
};

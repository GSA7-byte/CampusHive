const jwt = require("jsonwebtoken");

const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || "campushive_secret",
    { expiresIn: process.env.JWT_EXPIRE || "7d" }
  );
};

module.exports = generateToken;
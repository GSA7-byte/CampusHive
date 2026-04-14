require("dotenv").config();
require("dns").setServers(["8.8.8.8", "8.8.4.4"]);
const mongoose = require("mongoose");

const connectToMongo = () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.error("MONGODB_URI is not defined in .env file");
    process.exit(1);
  }

  console.log("Connecting to MongoDB...");

  mongoose
    .connect(mongoURI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 15000,
    })
    .then(() => {
      console.log("Connected to MongoDB Successfully");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error.message);
    });
};

module.exports = connectToMongo;
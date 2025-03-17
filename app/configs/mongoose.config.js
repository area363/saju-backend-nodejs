require("dotenv").config();

module.exports = {
  dev: {
    mongoURI: process.env.DEV_MONGO_URI || "mongodb://localhost:27017/devDB",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  prod: {
    mongoURI: process.env.PROD_MONGO_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
};

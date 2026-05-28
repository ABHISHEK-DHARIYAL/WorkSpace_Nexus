const dotenv = require("dotenv");
dotenv.config();

const ENV = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
  NODE_ENV: process.env.NODE_ENV || "development"
};

module.exports = { ENV };
module.exports = { ENV  };



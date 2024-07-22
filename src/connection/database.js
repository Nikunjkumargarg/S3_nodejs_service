const { Sequelize } = require("sequelize"); // Correct way to import Sequelize
const sequelize = new Sequelize("s3_bucket_clone", "root", "Nikunj@gauri32", {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;

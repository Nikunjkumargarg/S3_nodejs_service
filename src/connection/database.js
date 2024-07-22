const { Sequelize } = require("sequelize");
const dbName = process.env.DBNAME;
const dbUsername = process.env.DBUSERNAME;
const dbPassword = process.env.DBPASSWORD;
console.log(dbName, dbUsername, dbPassword); // Correct way to import Sequelize
const sequelize = new Sequelize(dbName, dbUsername, dbPassword, {
  dialect: "mysql",
  host: "localhost",
});

module.exports = sequelize;

const { DataTypes } = require("sequelize");
const sequelize = require("../connection/database");
const Users = require("../models/Users");
const Bucket = sequelize.define("Buckets", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
    primaryKey: true,
    unique: true,
  },
  createdAt: {
    type: DataTypes.TIME,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  userid: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Users,
      key: "id",
    },
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
});

module.exports = Bucket;

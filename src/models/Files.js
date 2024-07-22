const { DataTypes } = require("sequelize");
const sequelize = require("../connection/database");
const Buckets = require("../models/Buckets");
const File = sequelize.define("Files", {
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
  url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  bucketName: {
    type: DataTypes.UUID,
    references: { model: Buckets, key: "id" },
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
  },
});

module.exports = File;

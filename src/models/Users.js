const { DataTypes } = require("sequelize");
const sequelize = require("../connection/database");

const User = sequelize.define("Users", {
  id: {
    type: DataTypes.UUID, // Use UUID for UUIDs
    defaultValue: DataTypes.UUIDV4, // Default value for UUID
    primaryKey: true, // This field will be the primary key
  },
  createdAt: {
    type: DataTypes.DATE, // Use DATE for datetime values
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Unique constraint
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  updatedAt: {
    type: DataTypes.DATE, // Use DATE for datetime values
    allowNull: false,
  },
});

module.exports = User;

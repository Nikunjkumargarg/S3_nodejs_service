require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const sequelize = require("./src/connection/database");
require("./src/models/Buckets");
require("./src/models/Files");
require("./src/models/Users");
const port = process.env.PORT || 3000;

console.log(path.join(__dirname, "src", "data", "public_data"));
// Import your routes
const s3BucketRoutes = require("./src/routes/s3Routes");
const s3AuthRoutes = require("./src/routes/s3AuthRoutes");

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files (e.g., for front-end assets)
app.use(
  "/public",
  express.static(path.join(__dirname, "src", "data", "public_data"))
);

// Use the s3 routes
app.use("/api", s3BucketRoutes);
app.use("/api/auth", s3AuthRoutes);

// Error handling
app.use((req, res, next) => {
  res.status(404).json({ error: "Route does not exist" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

sequelize
  .sync()
  .then((result) => {})
  .catch((err) => {});
// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

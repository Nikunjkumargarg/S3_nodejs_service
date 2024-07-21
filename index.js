require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

// Import your routes
const s3Routes = require("./src/routes/s3Routes");

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files (e.g., for front-end assets)
app.use(
  "/files",
  express.static(path.join(__dirname, "src", "data", "public_data"))
);

// Use the s3 routes
app.use("/api", s3Routes);

// Error handling
app.use((req, res, next) => {
  res.status(404).send("Not Found");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

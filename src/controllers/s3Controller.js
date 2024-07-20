const { use } = require("../routes/s3Routes");
const s3Service = require("../services/s3Service");
const jwt = require("jsonwebtoken");
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
async function register(req, res) {
  const { username, password } = req.body;
  try {
    const existingUser = await s3Service.getUserByUsername(username);

    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    await s3Service.createUser(username, password);
    res.send("User registered");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error registering user");
  }
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401); // Unauthorized

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    req.user = user;
    console.log(user);
    next();
  });
}

async function login(req, res) {
  const { username, password } = req.body;
  try {
    const user = await s3Service.validateUser(username, password);
    console.log(user);
    // Generate JWT
    const accessToken = jwt.sign(
      { username: user.username, userid: user.id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { username: user.username, userid: user.id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ accessToken, refreshToken });
  } catch (error) {
    console.error(error);
    res.status(401).send("Invalid username or password");
  }
}

// Refresh token
async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.sendStatus(403); // Forbidden
  }

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Forbidden
    console.log("user", user);
    const accessToken = jwt.sign(
      { username: user.username, userid: user.userid },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    res.json({ accessToken });
  });
}

// Controller to create a bucket
const createBucket = async (req, res) => {
  try {
    const userId = req.user.userid;
    const { bucketName } = req.body;
    console.log("controller", userId, bucketName);
    // Validate bucketName
    if (!bucketName) {
      return res.status(400).json({ error: "Bucket name is required." });
    }

    // Create the bucket
    const result = await s3Service.createBucket(userId, bucketName);
    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }
    res.status(201).json({ message: "Bucket created successfully" });
  } catch (error) {
    console.error("Error creating bucket:", error.message);
    res.status(500).json({
      error: "Failed to create bucket",
      message: error.message,
    });
  }
};

// Controller to upload a file
const uploadFile = async (req, res) => {
  const userId = req.user.userid;
  console.log(userId);
  try {
    if (!req.file || !req.file.buffer) {
      return res
        .status(400)
        .json({ error: "No file uploaded or file is empty." });
    }

    const { bucketName } = req.params;
    // Use the filename from params if provided, otherwise default to the original filename
    const fileName = req.params.fileName || req.file.originalname;

    // Validate bucketName and fileName
    if (!bucketName || !fileName) {
      return res
        .status(400)
        .json({ error: "Bucket name or file name is missing." });
    }

    await s3Service.uploadFile(bucketName, fileName, userId, req.file.buffer);
    res.status(201).json({ message: "File uploaded successfully" });
  } catch (error) {
    console.error("Error uploading file:", error.message);
    res.status(500).json({
      error: "Failed to upload file",
      message: error.message,
    });
  }
};

// Controller to get a file
const getFile = async (req, res) => {
  try {
    const { bucketName, fileName } = req.params;
    const userId = req.user.userid;

    if (!bucketName || !fileName) {
      return res
        .status(400)
        .json({ error: "Bucket name or file name is missing." });
    }

    const fileStream = await s3Service.getFile(bucketName, fileName, userId);

    // Check if fileStream is null
    if (!fileStream) {
      return res.status(404).json({ error: "File not found." });
    }

    fileStream.pipe(res); // Stream the file to the response
  } catch (error) {
    console.error("Error retrieving file:", error.message);
    res.status(500).json({
      error: "Failed to retrieve file",
      message: error.message,
    });
  }
};

// Controller to delete a file
const deleteFile = async (req, res) => {
  try {
    const { bucketName, fileName } = req.params;
    const userId = req.user.userid;

    if (!bucketName || !fileName) {
      return res
        .status(400)
        .json({ error: "Bucket name or file name is missing." });
    }

    const result = await s3Service.deleteFile(bucketName, fileName, userId);

    if (result.success) {
      return res.status(200).json({ message: "File deleted successfully" });
    } else {
      return res
        .status(404)
        .json({ error: "File not found", message: result.message });
    }
  } catch (error) {
    console.error("Error deleting file:", error.message);
    res.status(500).json({
      error: "Failed to delete file",
      message: error.message,
    });
  }
};

// Controller to list files in a bucket
const listFiles = async (req, res) => {
  try {
    const { bucketName } = req.params;
    console.log("adfasf", bucketName);
    const userId = req.user.userid;
    if (!bucketName) {
      return res.status(400).json({ error: "Bucket name is missing." });
    }

    const files = await s3Service.listFiles(bucketName, userId);
    res.status(200).json(files);
  } catch (error) {
    console.error("Error listing files:", error.message);
    res.status(500).json({
      error: "Failed to list files",
      message: error.message,
    });
  }
};

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
  listFiles,
  createBucket,
  register,
  login,
  refreshToken,
  authenticateToken,
};

const s3Service = require("../services/s3Service");

// Controller to create a bucket
const createBucket = async (req, res) => {
  try {
    const { bucketName } = req.body;

    // Validate bucketName
    if (!bucketName) {
      return res.status(400).json({ error: "Bucket name is required." });
    }

    // Create the bucket
    await s3Service.createBucket(bucketName);
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

    await s3Service.uploadFile(bucketName, fileName, req.file.buffer);
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

    if (!bucketName || !fileName) {
      return res
        .status(400)
        .json({ error: "Bucket name or file name is missing." });
    }

    const fileStream = await s3Service.getFile(bucketName, fileName);

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

    if (!bucketName || !fileName) {
      return res
        .status(400)
        .json({ error: "Bucket name or file name is missing." });
    }

    await s3Service.deleteFile(bucketName, fileName);
    res.status(200).json({ message: "File deleted successfully" });
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

    if (!bucketName) {
      return res.status(400).json({ error: "Bucket name is missing." });
    }

    const files = await s3Service.listFiles(bucketName);
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
};

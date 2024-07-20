const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });
const s3Controller = require("../controllers/s3Controller");

// Route to create a bucket
router.post("/buckets", s3Controller.createBucket);

// Route to upload a file to a specified bucket
router.post(
  "/buckets/:bucketName/objects/:fileName?",
  upload.single("file"),
  s3Controller.uploadFile
);

// Route to get a file from a specified bucket
router.get("/buckets/:bucketName/objects/:fileName", s3Controller.getFile);

// Route to delete a file from a specified bucket
router.delete(
  "/buckets/:bucketName/objects/:fileName",
  s3Controller.deleteFile
);

// Route to list files in a specified bucket
router.get("/buckets/:bucketName/objects", s3Controller.listFiles);

module.exports = router;

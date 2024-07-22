const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({ storage: storage });
const s3Controller = require("../controllers/s3Controller");
const {
  validateCreateBucket,
  validateFileUpload,
  validateGetFile,
  validateDeleteFile,
  validateListFiles,
  validateChangeBucketPrivacy,
  handleValidationErrors,
  validateUserId,
  validateBucketName,
} = require("../validationRules");

// Route to create a bucket
router.post(
  "/bucket",
  s3Controller.authenticateToken,
  validateCreateBucket,
  handleValidationErrors,
  s3Controller.createBucket
);

// Route to get all buckets for a user
router.get(
  "/bucket",
  s3Controller.authenticateToken,
  validateUserId,
  s3Controller.getAllBucketsForUserController
);

// Route to get a specific bucket by name
router.get(
  "/bucket/:bucketName",
  s3Controller.authenticateToken,
  validateBucketName,
  s3Controller.getBucketByNameController
);
module.exports = router;

// Route to upload a file to a specified bucket
router.post(
  "/bucket/:bucketName/objects/:fileName?",
  s3Controller.authenticateToken,
  validateFileUpload,
  handleValidationErrors,
  upload.single("file"),
  s3Controller.uploadFile
);

// Route to get a file from a specified bucket
router.get(
  "/bucket/:bucketName/objects/:fileName",
  s3Controller.authenticateToken,
  validateGetFile,
  handleValidationErrors,
  s3Controller.getFile
);

// Route to delete a file from a specified bucket
router.delete(
  "/bucket/:bucketName/objects/:fileName",
  s3Controller.authenticateToken,
  validateDeleteFile,
  handleValidationErrors,
  s3Controller.deleteFile
);

// Route to list files in a specified bucket
router.get(
  "/bucket/:bucketName/objects",
  s3Controller.authenticateToken,
  validateListFiles,
  handleValidationErrors,
  s3Controller.listFiles
);

router.put(
  "/bucket/changePrivacy",
  s3Controller.authenticateToken,
  validateChangeBucketPrivacy,
  handleValidationErrors,
  s3Controller.changeBucketPrivacy
);
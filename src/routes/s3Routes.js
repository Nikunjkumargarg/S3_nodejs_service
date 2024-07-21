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
  validateLogin,
  validateRegister,
  validateRefreshToken,
  validateUserId,
  validateBucketName,
} = require("../validationRules");
// Route to create a bucket
router.post(
  "/buckets",
  s3Controller.authenticateToken,
  validateCreateBucket,
  handleValidationErrors,
  s3Controller.createBucket
);
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  s3Controller.register
);
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  s3Controller.login
);
router.post("/refreshtoken", validateRefreshToken, s3Controller.refreshToken);
// Route to upload a file to a specified bucket
router.post(
  "/buckets/:bucketName/objects/:fileName?",
  s3Controller.authenticateToken,
  validateFileUpload,
  handleValidationErrors,
  upload.single("file"),
  s3Controller.uploadFile
);

// Route to get a file from a specified bucket
router.get(
  "/buckets/:bucketName/objects/:fileName",
  s3Controller.authenticateToken,
  validateGetFile,
  handleValidationErrors,
  s3Controller.getFile
);

// Route to delete a file from a specified bucket
router.delete(
  "/buckets/:bucketName/objects/:fileName",
  s3Controller.authenticateToken,
  validateDeleteFile,
  handleValidationErrors,
  s3Controller.deleteFile
);

// Route to list files in a specified bucket
router.get(
  "/buckets/:bucketName/objects",
  s3Controller.authenticateToken,
  validateListFiles,
  handleValidationErrors,
  s3Controller.listFiles
);

router.put(
  "/changePrivacy",
  s3Controller.authenticateToken,
  validateChangeBucketPrivacy,
  handleValidationErrors,
  s3Controller.changeBucketPrivacy
);

// Route to get all buckets for a user
router.get(
  "/buckets/:userId",
  s3Controller.authenticateToken,
  validateUserId,
  s3Controller.getAllBucketsForUserController
);

// Route to get a specific bucket by name
router.get(
  "/buckets/:userId/:bucketName",
  s3Controller.authenticateToken,
  validateBucketName,
  s3Controller.getBucketByNameController
);
module.exports = router;

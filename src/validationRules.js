const { body, param, validationResult } = require("express-validator");

const validateRegister = [
  body("username")
    .isString()
    .notEmpty()
    .withMessage("Username is required.")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters."),
  body("password")
    .isString()
    .notEmpty()
    .withMessage("Password is required.")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long."),
];

// Validation rules for user login
const validateLogin = [
  body("username").isString().notEmpty().withMessage("Username is required."),
  body("password").isString().notEmpty().withMessage("Password is required."),
];

// Validation rules for creating a bucket
const validateCreateBucket = [
  body("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required.")
    .isLength({ min: 3, max: 50 })
    .withMessage("Bucket name must be between 3 and 50 characters."),
  body("isPrivate").isBoolean().withMessage("Privacy must be a boolean value."),
];

// Validation rules for file operations
const validateFileUpload = [
  param("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required."),
  body("fileName")
    .optional()
    .isString()
    .withMessage("File name must be a string."),
];

// Validation rules for getting a file
const validateGetFile = [
  param("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required."),
  param("fileName").isString().notEmpty().withMessage("File name is required."),
];

// Validation rules for deleting a file
const validateDeleteFile = [
  param("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required."),
  param("fileName").isString().notEmpty().withMessage("File name is required."),
];

// Validation rules for listing files
const validateListFiles = [
  param("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required."),
];

// Validation rules for changing bucket privacy
const validateChangeBucketPrivacy = [
  body("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required."),
  body("newPrivacy")
    .isBoolean()
    .withMessage("Privacy must be a boolean value."),
];

// Function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRefreshToken = [
  body("refreshToken")
    .isString()
    .notEmpty()
    .withMessage("Refresh token is required.")
    .isJWT()
    .withMessage("Invalid refresh token format."),
];

const validateUserId = [
  param("userId")
    .isString()
    .notEmpty()
    .withMessage("User ID is required.")
    .isLength({ min: 1 })
    .withMessage("Invalid User ID format."),
];

// Validation rules for getting a bucket by name
const validateBucketName = [
  param("userId")
    .isString()
    .notEmpty()
    .withMessage("User ID is required.")
    .isLength({ min: 1 })
    .withMessage("Invalid User ID format."),
  param("bucketName")
    .isString()
    .notEmpty()
    .withMessage("Bucket name is required.")
    .isLength({ min: 1 })
    .withMessage("Invalid bucket name format."),
];

module.exports = {
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
};

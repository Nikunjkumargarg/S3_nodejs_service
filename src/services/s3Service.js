const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const Bucket = require("../models/Buckets");
const File = require("../models/Files");
const User = require("../models/Users");

// Define directory paths for public and private data
const PUBLIC_DATA_DIR = path.join(__dirname, "../data/public_data");
const PRIVATE_DATA_DIR = path.join(__dirname, "../data/private_data");

//function to fetch the registered user
async function getUserByUsername(username) {
  try {
    console.log(User);
    const user = await User.findOne({ where: { username } });
    console.log(user);
    if (!user) return null;
    return user;
  } catch (err) {
    console.error("Error fetching user by username:", err.message);
    throw new Error("Error fetching user", err.message);
  }
}

//function to register a new user
async function createUser(username, password) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    return user;
  } catch (err) {
    console.error("Error creating user:", err.message);
    throw new Error("Error creating user:", err.message);
  }
}

//function to check the data director exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
      console.error("Failed to create directory:", err.message);
      throw new Error(
        `Unable to create directory at path: ${dirPath}. Please check permissions and path.`
      );
    }
  }
};

//function to validate the user credentials
async function validateUser(username, password) {
  try {
    const user = await getUserByUsername(username);
    if (!user) throw new Error("User not found");

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new Error("Invalid password");

    return user;
  } catch (err) {
    console.error("Error validating user:", err.message);
    throw new Error("Error validating user:", err.message);
  }
}

//function to check the user bucket exists
const bucketExists = async (userId, bucketName) => {
  try {
    const bucket = await Bucket.findOne({
      where: { name: bucketName, userid: userId },
      attributes: ["id", "is_private"],
    });

    if (!bucket) return { exists: false, bucketId: null, isPrivate: false };

    return {
      exists: true,
      bucketId: bucket.id,
      isPrivate: bucket.is_private,
    };
  } catch (err) {
    console.error("Error checking bucket existence:", err.message);
    throw new Error("Error checking bucket existence:", err.message);
  }
};

//function to create a new bucket
const createBucket = async (userId, bucketName, isPrivate = true) => {
  try {
    const response = await bucketExists(userId, bucketName);
    if (response.exists)
      return { success: false, message: "Bucket already exists." };

    const bucket = await Bucket.create({
      name: bucketName,
      userid: userId,
      is_private: isPrivate,
    });

    ensureDirectoryExists(PUBLIC_DATA_DIR);
    ensureDirectoryExists(PRIVATE_DATA_DIR);

    const bucketDir = isPrivate
      ? path.join(PRIVATE_DATA_DIR, userId, bucketName)
      : path.join(PUBLIC_DATA_DIR, bucketName);

    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    return { success: true, data: bucket };
  } catch (err) {
    console.error("Error creating bucket:", err.message);
    throw new Error("Error creating bucket:", err.message);
  }
};

//function to get user all buckets
const getAllBucketsForUser = async (userId) => {
  try {
    const buckets = await Bucket.findAll({ where: { userid: userId } });
    return buckets;
  } catch (err) {
    console.error("Error fetching buckets:", err.message);
    throw new Error("Error fetching buckets:", err.message);
  }
};

//function to get a particular bucket of user
const getBucketByName = async (userId, bucketName) => {
  try {
    console.log(userId, bucketName);
    const bucket = await Bucket.findOne({
      where: { userid: userId, name: bucketName },
    });
    console.log(bucket);
    if (!bucket) throw new Error("Bucket not found");
    return bucket;
  } catch (err) {
    console.error("Error fetching bucket:", err.message);
    throw new Error(err.message);
  }
};

//function to upload a file in user bucket
const uploadFile = async (bucketName, fileName, userId, fileBuffer) => {
  try {
    const response = await bucketExists(userId, bucketName);
    if (!response.exists)
      throw new Error(`Bucket '${bucketName}' does not exist.`);

    const bucketDir = response.isPrivate
      ? path.join(PRIVATE_DATA_DIR, userId, bucketName)
      : path.join(PUBLIC_DATA_DIR, bucketName);

    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    const filePath = path.join(bucketDir, fileName);
    fs.writeFileSync(filePath, fileBuffer);
    const fileSize = Buffer.byteLength(fileBuffer);
    const fileUrl = response.isPrivate
      ? `http://localhost:3000/api/bucket/${bucketName}/objects/${fileName}` // For private files, you can choose not to expose a URL or generate a temporary URL
      : `http://localhost:3000/public/${bucketName}/${fileName}`;

    const [file, created] = await File.upsert(
      {
        name: fileName,
        url: fileUrl,
        bucketName: response.bucketId,
        size: fileSize,
      },
      {
        returning: true,
      }
    );

    return file;
  } catch (err) {
    console.error("Error uploading file:", err.message);
    throw new Error("Error uploading file:", err.message);
  }
};

//function to fet a particular file from bucket
const getFile = async (bucketName, fileName, userId) => {
  try {
    const { exists, isPrivate } = await bucketExists(userId, bucketName);
    if (!exists)
      throw new Error(
        `Bucket '${bucketName}' not found or does not belong to the user.`
      );

    if (isPrivate && !(await isAuthorized(userId, bucketName))) {
      throw new Error("Access denied to private bucket.");
    }

    const directory = isPrivate
      ? path.join(PRIVATE_DATA_DIR, userId, bucketName)
      : path.join(PUBLIC_DATA_DIR, bucketName);

    const filePath = path.join(directory, fileName);

    if (!fs.existsSync(filePath))
      throw new Error(`File '${fileName}' not found in bucket '${bucketName}'`);

    return fs.createReadStream(filePath);
  } catch (err) {
    console.error("Error getting file:", err.message);
    throw new Error("Error getting file");
  }
};

//function to check if the bucket is accessed by the registered user
const isAuthorized = async (userId, bucketName) => {
  try {
    const bucket = await Bucket.findOne({
      where: { name: bucketName },
      attributes: ["userid"],
    });
    if (!bucket) throw new Error(`Bucket '${bucketName}' not found.`);
    return bucket.userid === userId;
  } catch (err) {
    console.error("Error checking authorization:", err.message);
    throw new Error("Error checking authorization:", err.message);
  }
};

//function to delete the file from bucket
const deleteFile = async (bucketName, fileName, userId) => {
  try {
    const { exists, bucketId, isPrivate } = await bucketExists(
      userId,
      bucketName
    );
    console.log(exists, bucketName, isPrivate);
    if (!exists)
      throw new Error(
        `Bucket '${bucketName}' not found or does not belong to the user.`
      );

    if (isPrivate && !(await isAuthorized(userId, bucketName))) {
      throw new Error("Access denied to private bucket.");
    }

    const baseDir = isPrivate ? PRIVATE_DATA_DIR : PUBLIC_DATA_DIR;
    let filePath;
    if (isPrivate) {
      filePath = path.join(baseDir, userId, bucketName, fileName);
    } else {
      filePath = path.join(baseDir, bucketName, fileName);
    }

    console.log(baseDir);
    console.log(filePath);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      return {
        success: false,
        message: `File '${fileName}' not found in bucket '${bucketName}' for deletion.`,
      };
    }

    await File.destroy({
      where: {
        name: fileName,
        bucketName: bucketId,
      },
    });

    return { success: true };
  } catch (err) {
    console.error("Error deleting file:", err.message);
    throw new Error("Error deleting file", err.message);
  }
};

//function to get all bucket files of user
const listFiles = async (bucketName, userId) => {
  try {
    const { exists, bucketId, isPrivate } = await bucketExists(
      userId,
      bucketName
    );
    if (!exists)
      throw new Error(
        `Bucket '${bucketName}' not found or does not belong to the user.`
      );

    if (isPrivate && !(await isAuthorized(userId, bucketName))) {
      throw new Error("Access denied to private bucket.");
    }

    const files = await File.findAll({ where: { bucketName: bucketId } });
    return files;
  } catch (err) {
    console.error("Error listing files:", err.message);
    throw new Error("Error listing files", err.message);
  }
};

//function to bucket the user bucket privacy settings
const updateBucketPrivacy = async (bucketName, userId, newPrivacy) => {
  try {
    console.log(bucketName, userId, newPrivacy);
    const bucket = await Bucket.update(
      { is_private: newPrivacy },
      {
        where: { name: bucketName, userid: userId },
      }
    );
    if (!bucket) {
      throw new Error("Bucket not found or not updated");
    }
    moveFiles(bucketName, userId, newPrivacy);

    return bucket; // Return the updated bucket
  } catch (err) {
    console.error("Error updating bucket privacy:", err.message);
    throw new Error("Error updating bucket privacy:", err.message);
  }
};

//helper function of updateBucketPrivacy function. It helps moving the files with in the filesystem
const moveFiles = (bucketName, userId, isPrivate) => {
  console.log(isPrivate);
  let oldBaseDir;
  if (isPrivate) {
    oldBaseDir = path.join(PUBLIC_DATA_DIR, bucketName);
  } else {
    oldBaseDir = path.join(PRIVATE_DATA_DIR, userId, bucketName);
  }

  if (isPrivate) {
    newBaseDir = path.join(PRIVATE_DATA_DIR, userId, bucketName);
  } else {
    newBaseDir = path.join(PUBLIC_DATA_DIR, bucketName);
  }
  console.log(oldBaseDir);
  console.log(newBaseDir);
  if (!fs.existsSync(oldBaseDir)) {
    console.error("Old directory not found:", oldBaseDir);
    throw new Error("Old directory does not exist");
  }

  if (!fs.existsSync(newBaseDir)) {
    fs.mkdirSync(newBaseDir, { recursive: true });
  }

  // Move files from old directory to new directory
  fs.readdirSync(oldBaseDir).forEach((file) => {
    const oldFilePath = path.join(oldBaseDir, file);
    const newFilePath = path.join(newBaseDir, file);

    fs.renameSync(oldFilePath, newFilePath);
  });

  // Remove old directory
  fs.rmdirSync(oldBaseDir);
};

module.exports = {
  getUserByUsername,
  createUser,
  validateUser,
  createBucket,
  getAllBucketsForUser,
  getBucketByName,
  uploadFile,
  getFile,
  deleteFile,
  listFiles,
  updateBucketPrivacy,
  moveFiles,
};
const fs = require("fs");
const path = require("path");
const supabase = require("../supabaseClient");
const bcrypt = require("bcrypt");
// Define the directory to store uploaded files
//const UPLOAD_DIR = path.join(__dirname, "../data");

// Define directory paths for public and private data
const PUBLIC_DATA_DIR = path.join(__dirname, "../data/public_data");
const PRIVATE_DATA_DIR = path.join(__dirname, "../data/private_data");
async function getUserByUsername(username) {
  const { data, error } = await supabase
    .from("Users")
    .select("*")
    .eq("username", username);
  if (error) {
    throw error;
  }

  if (data.length === 0) {
    return null; // Or handle as appropriate
  }

  if (data.length > 1) {
    throw new Error("Multiple rows returned"); // Handle as appropriate
  }

  return data[0]; // Return the single row
}

async function createUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from("Users")
    .insert([{ username, password: hashedPassword }]);
  if (error) {
    throw error;
  }
  return data;
}

// Ensure the directory exists
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
    } catch (err) {
      console.error("Failed to create directory:", err);
      throw new Error(`Unable to create directory at path: ${dirPath}. Please check permissions and path.`);
    }
  }
};

async function validateUser(username, password) {
  const user = await getUserByUsername(username);

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid password");
  }

  return user;
}

// Function to check if a bucket exists
async function bucketExists(userId, bucketName) {
  try {
    console.log(userId, bucketName);

    // First, check if the bucket exists and get its details
    const { data, error } = await supabase
      .from("Buckets")
      .select("id, is_private, userid")
      .eq("name", bucketName)
      .maybeSingle();

    if (error) {
      console.error("Error checking bucket existence:", error.message);
      throw new Error("Unable to check bucket existence");
    }

    if (!data) {
      return { exists: false, bucketId: null, isPrivate: false };
    }

    // Check if the bucket is private and if the user is authorized
    if (data.is_private && data.userid !== userId) {
      return { exists: false, bucketId: null, isPrivate: true };
    }

    // Bucket exists and is accessible
    return {
      exists: true,
      bucketId: data.id,
      isPrivate: data.is_private,
    };
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
}


const createBucket = async (userId, bucketName, isPrivate = true) => {
  try {
    console.log("service", userId, bucketName);

    // Check if bucket already exists
    const response = await bucketExists(userId, bucketName);

    if (response.exists) {
      return { success: false, message: "Bucket already exists." };
    }

    // Proceed to create the new bucket
    const { data, error } = await supabase
      .from("Buckets")
      .insert([{ name: bucketName, userid: userId, is_private: isPrivate }]);

    if (error) {
      console.error("Error creating bucket:", error.message);
      throw new Error("Unable to create bucket");
    }

    // Ensure the main directories exist
    ensureDirectoryExists(PUBLIC_DATA_DIR);
    ensureDirectoryExists(PRIVATE_DATA_DIR);

    // Determine the directory based on privacy setting
    // const baseDir = isPrivate ? PRIVATE_DATA_DIR : PUBLIC_DATA_DIR;
    // const bucketDir = path.join(baseDir, userId, bucketName);
    const bucketDir = isPrivate ? path.join(__dirname,'../data','private_data', userId, bucketName) : path.join(__dirname, '../data', 'public_data', bucketName);

    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    return { success: true, data };
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};

//Get buckets
// Function to get all buckets for a user
const getAllBucketsForUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from("Buckets")
      .select("*")
      .eq("userid", userId);

    if (error) {
      console.error("Error fetching buckets:", error.message);
      throw new Error("Unable to fetch buckets");
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};

//get a specific bucket
const getBucketByName = async (userId, bucketName) => {
  try {
    const { data, error } = await supabase
      .from("Buckets")
      .select("*")
      .eq("userid", userId)
      .eq("name", bucketName)
      .single();

    if (error) {
      console.error("Error fetching bucket:", error.message);
      throw new Error("Unable to fetch bucket");
    }

    if (!data) {
      throw new Error("Bucket not found");
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};

const uploadFile = async (bucketName, fileName, userId, fileBuffer) => {
  // Check if the bucket exists
  console.log(userId, bucketName);
  const response = await bucketExists(userId, bucketName);
  console.log("Bucket check response:", response);

  if (!response.exists) {
    throw new Error(`Bucket '${bucketName}' does not exist.`);
  }

  // Determine the correct directory based on privacy
  // const directory = response.isPrivate ? "private_data" : "public_data";
  // const bucketDir = path.join(__dirname,'../data',directory, userId, bucketName);
  const bucketDir = response.isPrivate ? path.join(__dirname,'../data','private_data', userId, bucketName) : path.join(__dirname, '../data', 'public_data', bucketName);

  try {
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating bucket directory:", err.message);
    throw new Error("Unable to create bucket directory");
  }

  const filePath = path.join(bucketDir, fileName);

  try {
    fs.writeFileSync(filePath, fileBuffer, { flag: "w" });
  } catch (err) {
    console.error("Error writing file to filesystem:", err.message);
    throw new Error("Unable to write file to filesystem");
  }

  // Get file size
  const fileSize = Buffer.byteLength(fileBuffer);

  try {
    const { data, error } = await supabase.from("Files").upsert([
      {
        name: fileName,
        url: filePath, // Ensure this URL is properly handled
        bucketName: response.bucketId,
        size: fileSize,
      },
    ]);

    if (error) {
      console.error("Error inserting file metadata into Supabase:", error.message);
      throw new Error("Unable to insert file metadata");
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};

const getFile = async (bucketName, fileName, userId) => {
  console.log('hello');
  // Check if the bucket exists and get its privacy setting
  console.log(bucketName,fileName,userId);
  const { exists, isPrivate } = await bucketExists(userId, bucketName);
  if (!exists) {
    throw new Error(`Bucket '${bucketName}' not found or does not belong to the user.`);
  }

  // Verify if the bucket is private and if the user is authorized
  if (isPrivate && !isAuthorized(userId)) {
    throw new Error("Access denied to private bucket.");
  }

  const directory = isPrivate ? path.join(__dirname,'../data', 'private_data', userId, bucketName) : path.join(__dirname, '../data', 'public_data', bucketName);
  const filePath = path.join(directory,fileName);

  // Ensure the file exists
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    throw new Error(`File '${fileName}' not found in bucket '${bucketName}'.`);
  }

  try {
    return fs.createReadStream(filePath);
  } catch (err) {
    console.error("Failed to read file from filesystem:", err.message);
    throw new Error(`Unable to read file '${fileName}' from directory '${filePath}'.`);
  }
};

const isAuthorized = async (userId, bucketName) => {
  try {
    // Fetch bucket details to check ownership
    const { data, error } = await supabase
      .from("Buckets")
      .select("userid")
      .eq("name", bucketName)
      .maybeSingle();

    if (error) {
      console.error("Error fetching bucket details:", error.message);
      throw new Error("Failed to check bucket ownership.");
    }

    if (!data) {
      throw new Error(`Bucket '${bucketName}' not found.`);
    }

    // Check if the userId matches the bucket ownerId
    return data.userid === userId;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Authorization check failed.");
  }
};



const deleteFile = async (bucketName, fileName, userId) => {
  const { exists, bucketId, isPrivate } = await bucketExists(userId, bucketName);
  if (!exists) {
    throw new Error(`Bucket '${bucketName}' not found or does not belong to the user.`);
  }

  // Check authorization for private buckets
  if (isPrivate && !isAuthorized(userId)) {
    throw new Error("Access denied to private bucket.");
  }

  const directory = isPrivate ? "private_data" : "public_data";
  const filePath = path.join(directory, userId, bucketName, fileName);

  // Ensure the file exists before attempting to delete it
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return { success: true };
    } else {
      return {
        success: false,
        message: `File '${fileName}' not found in bucket '${bucketName}' for deletion.`,
      };
    }
  } catch (err) {
    console.error("Failed to delete file from filesystem:", err.message);
    throw new Error(`Unable to delete file '${fileName}' from directory '${filePath}'.`);
  }

  // Delete the file metadata from the Supabase database
  try {
    const { error } = await supabase
      .from("Files")
      .delete()
      .eq("name", fileName)
      .eq("bucketName", bucketId);

    if (error) {
      console.error("Supabase error while deleting file metadata:", error.message);
      throw new Error(`Failed to delete metadata for file '${fileName}' from Supabase: ${error.message}`);
    }
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed. Check your Supabase configuration and schema.");
  }
};


// Function to list files in a bucket
const listFiles = async (bucketName, userId) => {
  try {
    const { exists, bucketId, isPrivate } = await bucketExists(userId, bucketName);
    if (!exists) {
      throw new Error(`Bucket '${bucketName}' not found or does not belong to the user.`);
    }

    // Check if the user is authorized to view files in a private bucket
    if (isPrivate && !isAuthorized(userId)) {
      throw new Error("Access denied to private bucket.");
    }

    // List files from the Supabase database
    const { data, error } = await supabase
      .from("Files")
      .select("*")
      .eq("bucketName", bucketId);

    if (error) {
      console.error("Supabase error while listing files:", error.message);
      throw new Error(`Failed to list files for bucket '${bucketName}': ${error.message}`);
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed. Check your Supabase configuration and schema.");
  }
};

//update bucket privacy
const updateBucketPrivacy = async (bucketName, userId, newPrivacy) => {
  try {
    const { data, error } = await supabase
      .from("Buckets")
      .update({ is_private: newPrivacy })
      .eq("name", bucketName)
      .eq("userid", userId);

    if (error) {
      console.error("Error updating bucket privacy:", error.message);
      throw new Error("Unable to update bucket privacy");
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};

const moveFiles = (bucketName, userId, isPrivate) => {
  const oldBaseDir = isPrivate ? path.join(PUBLIC_DATA_DIR, bucketName) : path.join(PRIVATE_DATA_DIR, userId, bucketName);
  const newBaseDir = isPrivate ? path.join(PRIVATE_DATA_DIR, userId, bucketName) : path.join(PUBLIC_DATA_DIR, bucketName);

  if (!fs.existsSync(oldBaseDir)) {
    console.error("Old directory not found:", oldBaseDir);
    throw new Error("Old directory does not exist");
  }

  if (!fs.existsSync(newBaseDir)) {
    fs.mkdirSync(newBaseDir, { recursive: true });
  }

  // Move files from old directory to new directory
  fs.readdirSync(oldBaseDir).forEach(file => {
    const oldFilePath = path.join(oldBaseDir, file);
    const newFilePath = path.join(newBaseDir, file);

    fs.renameSync(oldFilePath, newFilePath);
  });

  // Remove old directory
  fs.rmdirSync(oldBaseDir);
};

const changeBucketPrivacy = async (bucketName, userId, newPrivacy) => {
  try {
    await updateBucketPrivacy(bucketName, userId, newPrivacy);
    moveFiles(bucketName, userId, newPrivacy);

    console.log(`Bucket '${bucketName}' privacy updated successfully.`);
  } catch (err) {
    console.error("Error changing bucket privacy:", err.message);
    throw new Error("Failed to change bucket privacy");
  }
};

module.exports = {
  uploadFile,
  getFile,
  deleteFile,
  listFiles,
  createBucket,
  getUserByUsername,
  createUser,
  validateUser,
  getAllBucketsForUser,
  getBucketByName,
  changeBucketPrivacy,
  updateBucketPrivacy,
  moveFiles
};

const fs = require("fs");
const path = require("path");
const supabase = require("../supabaseClient");
const bcrypt = require("bcrypt");
// Define the directory to store uploaded files
const UPLOAD_DIR = path.join(__dirname, "../data");

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
if (!fs.existsSync(UPLOAD_DIR)) {
  try {
    fs.mkdirSync(UPLOAD_DIR);
  } catch (err) {
    console.error("Failed to create upload directory:", err);
    throw new Error(
      "Unable to create upload directory. Please check permissions and path."
    );
  }
}

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
async function bucketExists(bucketName) {
  try {
    const { data, error, count } = await supabase
      .from("Buckets")
      .select("name", { count: "exact" })
      .eq("name", bucketName)
      .maybeSingle(); // Use maybeSingle to avoid errors for no rows

    if (error) {
      console.error("Error checking bucket existence:", error.message);
      throw new Error("Unable to check bucket existence");
    }

    // Check if any row exists
    return data !== null;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
}

// Function to create a new bucket
const createBucket = async (bucketName) => {
  try {
    // Check if bucket already exists
    const exists = await bucketExists(bucketName);
    if (exists) {
      throw new Error("Bucket already exists.");
    }

    const { data, error } = await supabase
      .from("Buckets")
      .insert([{ name: bucketName }]);

    if (error) {
      console.error("Error creating bucket:", error.message);
      throw new Error("Unable to create bucket");
    }

    // Create the directory for the bucket if it doesn't exist
    const bucketDir = path.join(UPLOAD_DIR, bucketName);
    if (!fs.existsSync(bucketDir)) {
      fs.mkdirSync(bucketDir, { recursive: true });
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};

// Function to upload a file to the filesystem
const uploadFile = async (bucketName, fileName, fileBuffer) => {
  // Check if the bucket exists
  const exists = await bucketExists(bucketName);
  if (!exists) {
    throw new Error(`Bucket '${bucketName}' does not exist.`);
  }

  const bucketDir = path.join(UPLOAD_DIR, bucketName);

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
    const { data, error } = await supabase
      .from("Files")
      .insert([{ name: fileName, url: filePath, bucketName, size: fileSize }]);

    if (error) {
      console.error(
        "Error inserting file metadata into Supabase:",
        error.message
      );
      throw new Error("Unable to insert file metadata");
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error("Supabase operation failed");
  }
};
// Function to get a file from the filesystem
const getFile = async (bucketName, fileName) => {
  const filePath = path.join(UPLOAD_DIR, bucketName, fileName);

  // Ensure the file exists
  if (!fs.existsSync(filePath)) {
    console.error("File not found:", filePath);
    throw new Error(`File '${fileName}' not found in bucket '${bucketName}'.`);
  }

  try {
    return fs.createReadStream(filePath);
  } catch (err) {
    console.error("Failed to read file from filesystem:", err.message);
    throw new Error(
      `Unable to read file '${fileName}' from directory '${filePath}'.`
    );
  }
};

// Function to delete a file from the filesystem
const deleteFile = async (bucketName, fileName) => {
  const filePath = path.join(UPLOAD_DIR, bucketName, fileName);

  // Ensure the file exists before attempting to delete it
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.error("File not found for deletion:", filePath);
      throw new Error(
        `File '${fileName}' not found in bucket '${bucketName}' for deletion.`
      );
    }
  } catch (err) {
    console.error("Failed to delete file from filesystem:", err.message);
    throw new Error(
      `Unable to delete file '${fileName}' from directory '${filePath}'.`
    );
  }

  // Delete the file metadata from the Supabase database
  try {
    const { error } = await supabase
      .from("Files")
      .delete()
      .eq("name", fileName)
      .eq("bucketName", bucketName);

    if (error) {
      console.error(
        "Supabase error while deleting file metadata:",
        error.message
      );
      throw new Error(
        `Failed to delete metadata for file '${fileName}' from Supabase: ${error.message}`
      );
    }
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error(
      "Supabase operation failed. Check your Supabase configuration and schema."
    );
  }
};

// Function to list files in a bucket
const listFiles = async (bucketName) => {
  try {
    // List files from the Supabase database
    const { data, error } = await supabase
      .from("Files")
      .select("*")
      .eq("bucketName", bucketName);

    if (error) {
      console.error("Supabase error while listing files:", error.message);
      throw new Error(
        `Failed to list files for bucket '${bucketName}': ${error.message}`
      );
    }

    return data;
  } catch (err) {
    console.error("Error during Supabase operation:", err.message);
    throw new Error(
      "Supabase operation failed. Check your Supabase configuration and schema."
    );
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
};

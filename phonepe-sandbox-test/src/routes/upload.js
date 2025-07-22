const express = require("express");
const router = express.Router();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// Import middleware (create simple fallbacks if they don't exist)
const authMiddleware = require("../middleware/auth");
const rateLimiter = require("../middleware/rateLimiter");
const logger = require("../utils/logger");
const { supabase } = require("../config/supabaseClient");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Apply upload-specific rate limiting (with fallback)
try {
  router.use(rateLimiter.uploadLimiter());
} catch (error) {
  console.log("Rate limiter not available, skipping...");
}

// Configure Cloudinary storage for different file types
const createCloudinaryStorage = (folder, allowedFormats) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `shrifal-handicrafts/${folder}`,
      allowed_formats: allowedFormats,
      public_id: (req, file) => `${uuidv4()}-${Date.now()}`,
      resource_type: "auto", // Automatically detect resource type
    },
  });
};

// Different storage configurations
const imageStorage = createCloudinaryStorage("images", [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
]);
const documentStorage = createCloudinaryStorage("documents", [
  "pdf",
  "doc",
  "docx",
]);
const receiptStorage = createCloudinaryStorage("receipts", [
  "jpg",
  "jpeg",
  "png",
  "pdf",
]);

// File filter function
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`
        ),
        false
      );
    }
  };
};

// Upload configurations
const imageUpload = multer({
  storage: imageStorage,
  fileFilter: createFileFilter([
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
  ]),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5,
  },
});

const documentUpload = multer({
  storage: documentStorage,
  fileFilter: createFileFilter([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});

const receiptUpload = multer({
  storage: receiptStorage,
  fileFilter: createFileFilter(["image/jpeg", "image/png", "application/pdf"]),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * @route   POST /api/upload/image
 * @desc    Upload single image to Cloudinary
 * @access  Private
 */
router.post("/image", imageUpload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Save file info to database
    const fileData = {
      filename: req.file.filename,
      original_name: req.file.originalname,
      cloudinary_url: req.file.path, // Cloudinary URL
      cloudinary_public_id: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploaded_by: req.user?.id || null,
      upload_type: "image",
      storage_type: "cloudinary",
    };

    const { data: fileRecord, error } = await supabase
      .from("file_uploads")
      .insert([fileData])
      .select()
      .single();

    if (error) {
      // If database save fails, delete from Cloudinary
      await cloudinary.uploader.destroy(req.file.filename);
      throw error;
    }

    logger?.info("Image uploaded successfully to Cloudinary", {
      fileId: fileRecord.id,
      filename: req.file.filename,
      userId: req.user?.id,
    });

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        fileId: fileRecord.id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: req.file.path, // Cloudinary URL
        cloudinaryPublicId: req.file.filename,
      },
    });
  } catch (error) {
    logger?.error("Image upload error", { error: error.message });
    next(error);
  }
});

/**
 * @route   POST /api/upload/images
 * @desc    Upload multiple images to Cloudinary
 * @access  Private
 */
router.post(
  "/images",
  imageUpload.array("images", 5),
  async (req, res, next) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadedFiles = [];
      const fileRecords = [];

      for (const file of req.files) {
        const fileData = {
          filename: file.filename,
          original_name: file.originalname,
          cloudinary_url: file.path,
          cloudinary_public_id: file.filename,
          size: file.size,
          mimetype: file.mimetype,
          uploaded_by: req.user?.id || null,
          upload_type: "image",
          storage_type: "cloudinary",
        };

        const { data: fileRecord, error } = await supabase
          .from("file_uploads")
          .insert([fileData])
          .select()
          .single();

        if (error) {
          // Clean up all uploaded files from Cloudinary if any database save fails
          for (const uploadedFile of req.files) {
            await cloudinary.uploader.destroy(uploadedFile.filename);
          }
          throw error;
        }

        fileRecords.push(fileRecord);
        uploadedFiles.push({
          fileId: fileRecord.id,
          filename: file.filename,
          originalName: file.originalname,
          size: file.size,
          url: file.path, // Cloudinary URL
          cloudinaryPublicId: file.filename,
        });
      }

      logger?.info("Multiple images uploaded successfully to Cloudinary", {
        count: req.files.length,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        message: `${req.files.length} images uploaded successfully`,
        data: uploadedFiles,
      });
    } catch (error) {
      logger?.error("Multiple images upload error", { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   POST /api/upload/document
 * @desc    Upload document to Cloudinary
 * @access  Private
 */
router.post(
  "/document",
  documentUpload.single("document"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No document uploaded",
        });
      }

      const fileData = {
        filename: req.file.filename,
        original_name: req.file.originalname,
        cloudinary_url: req.file.path,
        cloudinary_public_id: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploaded_by: req.user?.id || null,
        upload_type: "document",
        storage_type: "cloudinary",
        metadata: {
          description: req.body.description || null,
          category: req.body.category || null,
        },
      };

      const { data: fileRecord, error } = await supabase
        .from("file_uploads")
        .insert([fileData])
        .select()
        .single();

      if (error) {
        await cloudinary.uploader.destroy(req.file.filename);
        throw error;
      }

      res.json({
        success: true,
        message: "Document uploaded successfully",
        data: {
          fileId: fileRecord.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: req.file.path,
          cloudinaryPublicId: req.file.filename,
        },
      });
    } catch (error) {
      logger?.error("Document upload error", { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   POST /api/upload/receipt
 * @desc    Upload payment receipt to Cloudinary
 * @access  Private
 */
router.post(
  "/receipt",
  receiptUpload.single("receipt"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No receipt file uploaded",
        });
      }

      const { orderId, paymentId, description } = req.body;

      const fileData = {
        filename: req.file.filename,
        original_name: req.file.originalname,
        cloudinary_url: req.file.path,
        cloudinary_public_id: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploaded_by: req.user?.id || null,
        upload_type: "receipt",
        storage_type: "cloudinary",
        metadata: {
          orderId,
          paymentId,
          description,
        },
      };

      const { data: fileRecord, error } = await supabase
        .from("file_uploads")
        .insert([fileData])
        .select()
        .single();

      if (error) {
        await cloudinary.uploader.destroy(req.file.filename);
        throw error;
      }

      res.json({
        success: true,
        message: "Receipt uploaded successfully",
        data: {
          fileId: fileRecord.id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: req.file.path,
          cloudinaryPublicId: req.file.filename,
        },
      });
    } catch (error) {
      logger?.error("Receipt upload error", { error: error.message });
      next(error);
    }
  }
);

/**
 * @route   GET /api/upload/files
 * @desc    Get user's uploaded files
 * @access  Private
 */
router.get("/files", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("file_uploads")
      .select(
        "id, filename, original_name, size, mimetype, upload_type, cloudinary_url, created_at",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.user?.id) {
      query = query.eq("uploaded_by", req.user.id);
    }

    if (type) {
      query = query.eq("upload_type", type);
    }

    const { data: files, error, count } = await query;

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: files.map((file) => ({
        ...file,
        url: file.cloudinary_url, // Use Cloudinary URL
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger?.error("Get files error", { error: error.message });
    next(error);
  }
});

/**
 * @route   DELETE /api/upload/file/:fileId
 * @desc    Delete uploaded file from Cloudinary and database
 * @access  Private (owner or admin)
 */
router.delete("/file/:fileId", async (req, res, next) => {
  try {
    const { data: fileRecord, error } = await supabase
      .from("file_uploads")
      .select("*")
      .eq("id", req.params.fileId)
      .single();

    if (error || !fileRecord) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    // Check permission (if auth is available)
    if (
      req.user &&
      fileRecord.uploaded_by !== req.user.id &&
      !req.user.isAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Delete file from Cloudinary
    if (fileRecord.cloudinary_public_id) {
      await cloudinary.uploader.destroy(fileRecord.cloudinary_public_id);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("file_uploads")
      .delete()
      .eq("id", req.params.fileId);

    if (deleteError) {
      throw deleteError;
    }

    logger?.info("File deleted successfully from Cloudinary", {
      fileId: req.params.fileId,
      deletedBy: req.user?.id,
    });

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    logger?.error("File delete error", { error: error.message });
    next(error);
  }
});

// Error handler for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB.",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        message: "Too many files. Maximum is 5 files.",
      });
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        success: false,
        message: "Unexpected file field.",
      });
    }
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
});

module.exports = router;

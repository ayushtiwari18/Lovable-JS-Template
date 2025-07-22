const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage configuration for product images
const productStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "products",
    transformation: [
      { width: 800, height: 800, crop: "fill", quality: "auto" },
      { format: "auto" },
    ],
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

// Storage configuration for customization files
const customizationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "customizations",
    transformation: [
      { width: 1000, height: 1000, crop: "limit", quality: "auto" },
    ],
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

// Multer middleware
const uploadProduct = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const uploadCustomization = multer({
  storage: customizationStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Helper functions
const generateImageVariations = (publicId) => {
  return {
    thumbnail: cloudinary.url(publicId, {
      width: 150,
      height: 150,
      crop: "fill",
      quality: "auto",
      format: "auto",
    }),
    medium: cloudinary.url(publicId, {
      width: 400,
      height: 400,
      crop: "fill",
      quality: "auto",
      format: "auto",
    }),
    large: cloudinary.url(publicId, {
      width: 800,
      height: 800,
      crop: "fill",
      quality: "auto",
      format: "auto",
    }),
    original: cloudinary.url(publicId, {
      quality: "auto",
      format: "auto",
    }),
  };
};

const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadProduct,
  uploadCustomization,
  generateImageVariations,
  deleteImage,
};

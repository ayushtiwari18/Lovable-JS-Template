const express = require("express");
const router = express.Router();
const {
  uploadProduct,
  uploadCustomization,
  generateImageVariations,
  deleteImage,
  cloudinary,
} = require("../config/cloudinary");

// Single product image upload
router.post("/product", uploadProduct.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const imageVariations = generateImageVariations(req.file.filename);

    res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        publicId: req.file.filename,
        url: req.file.path,
        variations: imageVariations,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});

// Multiple product images upload
router.post("/products", uploadProduct.array("images", 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedImages = req.files.map((file) => ({
      publicId: file.filename,
      url: file.path,
      variations: generateImageVariations(file.filename),
    }));

    res.json({
      success: true,
      message: `${req.files.length} images uploaded successfully`,
      data: uploadedImages,
    });
  } catch (error) {
    console.error("Multiple upload error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});

// In routes/upload.js - update the customization route
router.post("/customization", uploadCustomization.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { orderId } = req.body; // Get orderId from form data

    res.json({
      success: true,
      message: "Customization file uploaded successfully",
      data: {
        publicId: req.file.filename,
        url: req.file.path,
        fileType: req.file.mimetype,
        orderId: orderId || null,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Customization upload error:", error);
    res.status(500).json({ error: "Upload failed", details: error.message });
  }
});

// Test image variations endpoint
router.get("/test-variations/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;
    const variations = generateImageVariations(publicId);

    res.json({
      success: true,
      publicId: publicId,
      variations: variations,
    });
  } catch (error) {
    console.error("Variations test error:", error);
    res
      .status(500)
      .json({ error: "Failed to generate variations", details: error.message });
  }
});

// Delete image endpoint
router.delete("/delete/:publicId", async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await deleteImage(publicId);

    res.json({
      success: true,
      message: "Image deleted successfully",
      result: result,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Delete failed", details: error.message });
  }
});

module.exports = router;

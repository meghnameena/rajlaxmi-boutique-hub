const express = require("express");

const {
  uploadMultipleImages,
  uploadProductVideo,
} = require("../controllers/imageController");

const protect = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/uploadMiddleware");
const videoUpload = require("../middleware/videoUploadMiddleware");

const router = express.Router();

// Admin only: Upload up to 5 product images
router.post(
  "/upload-multiple",
  protect,
  adminMiddleware,
  upload.array("images", 5),
  uploadMultipleImages
);

// Admin only: Upload product reel/video
router.post(
  "/upload-video",
  protect,
  adminMiddleware,
  videoUpload.single("video"),
  uploadProductVideo
);

module.exports = router;

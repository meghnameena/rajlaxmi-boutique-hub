const cloudinary = require("../config/cloudinary");

// Upload Single Image
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "rajlaxmi-boutique/products",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      image: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error("Image Upload Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
};

// Upload Multiple Images
const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required",
      });
    }

    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "rajlaxmi-boutique/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          }
        );

        uploadStream.end(file.buffer);
      });
    });

    const images = await Promise.all(uploadPromises);

    return res.status(201).json({
      success: true,
      message: "Images uploaded successfully",
      images,
    });
  } catch (error) {
    console.error("Multiple Image Upload Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Images upload failed",
    });
  }
};

// Upload Product Video / Reel
const uploadProductVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required",
      });
    }

    // Validate video MIME type
    if (!req.file.mimetype || !req.file.mimetype.startsWith("video/")) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid video file",
      });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "rajlaxmi-boutique/product-reels",
          resource_type: "video",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    return res.status(201).json({
      success: true,
      message: "Product reel uploaded successfully",
      video: {
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration || null,
        format: result.format || null,
      },
    });
  } catch (error) {
    console.error("Product Video Upload Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Video upload failed",
    });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  uploadProductVideo,
};

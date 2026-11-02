const multer = require("multer");

const storage = multer.memoryStorage();

const videoUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Maximum 50 MB per video
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Only MP4, WEBM and MOV videos are allowed.")
      );
    }
  },
});

module.exports = videoUpload;

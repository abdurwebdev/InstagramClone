const Post = require('../models/Post');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');

const createPost = async (req, res) => {
  try {
    const { type, title, caption, tags } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: "Post type is required" });
    }

    let mediaUrl = null;
    let thumbnailUrl = null;
    let mediaPublicId = null;

    if (type !== "text") {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Media file is required for image/video post" });
      }

      // Upload media to Cloudinary using stream
      const streamUpload = () => {
        return new Promise((resolve, reject) => {
          let stream = cloudinary.uploader.upload_stream(
            {
              resource_type: type === "video" ? "video" : "image",
              folder: "posts_mern",
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      const result = await streamUpload();
      mediaUrl = result.secure_url;
      mediaPublicId = result.public_id;

      // Generate a proper thumbnail for videos
      if (type === "video") {
        thumbnailUrl = cloudinary.url(result.public_id + ".jpg", {
          resource_type: "video",
          format: "jpg",
          transformation: [{ width: 400, height: 400, crop: "fill" }]
        });
      }
    }

    // Save post in MongoDB
    const newPost = await Post.create({
      user: req.user.id,
      type,
      title,
      caption,
      mediaUrl,
      mediaPublicId,
      thumbnailUrl,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: newPost,
    });

  } catch (error) {
    console.error("Error creating post:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating post",
      error: error.message,
    });
  }
};

module.exports = { createPost };

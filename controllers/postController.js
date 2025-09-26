const Post = require('../models/Post');
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Save = require('../models/Save');

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

const getPosts = async (req, res) => {
  try {
    const posts = await Post.find(); // ✅ await the query

    if (!posts || posts.length === 0) {
      return res.status(404).json({ success: false, message: "No posts found!" });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Posts retrieved successfully", 
      posts 
    });

  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

const getPostsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const posts = await Post.find({ user: userId });

    if (!posts || posts.length === 0) {
      return res.status(404).json({ success: false, message: "No posts found for this user" });
    }

    return res.status(200).json({
      success: true,
      message: "Posts by user fetched successfully",
      posts
    });

  } catch (error) {
    console.error("Error fetching posts by user:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

const likePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    // Remove user from dislikes first
    await Post.findByIdAndUpdate(id, {
      $pull: { dislikes: { user: userId } }
    });

    // If already liked, remove like
    const post = await Post.findOneAndUpdate(
      { _id: id, "likes.user": userId },
      { $pull: { likes: { user: userId } } },
      { new: true }
    ).populate("user", "name");

    if (post) {
      return res.status(200).json({
        message: "Like removed",
        likesCount: post.likes.length,
        dislikesCount: post.dislikes.length,
        post
      });
    }

    // Otherwise, add like
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { likes: { user: userId } } },
      { new: true }
    ).populate("user", "name");

    return res.status(200).json({
      message: "Post liked",
      likesCount: updatedPost.likes.length,
      dislikesCount: updatedPost.dislikes.length,
      post: updatedPost
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

const dislikePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    // Remove user from likes first
    await Post.findByIdAndUpdate(id, {
      $pull: { likes: { user: userId } }
    });

    // If already disliked, remove dislike
    const post = await Post.findOneAndUpdate(
      { _id: id, "dislikes.user": userId },
      { $pull: { dislikes: { user: userId } } },
      { new: true }
    ).populate("user", "name");

    if (post) {
      return res.status(200).json({
        message: "Dislike removed",
        likesCount: post.likes.length,
        dislikesCount: post.dislikes.length,
        post
      });
    }

    // Otherwise, add dislike
    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $addToSet: { dislikes: { user: userId } } },
      { new: true }
    ).populate("user", "name");

    return res.status(200).json({
      message: "Post disliked",
      likesCount: updatedPost.likes.length,
      dislikesCount: updatedPost.dislikes.length,
      post: updatedPost
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

const commentPost = async (req, res) => {
  try {
    const id = req.user.id; // ✅ Correct destructuring
    const { postId } = req.params;
    const { content } = req.body;

    // 1. Find user (only select safe fields)
    const currentUser = await User.findById(id).select("name email _id");

    // 2. Create comment
    const createdComment = await Comment.create({
      content,
      post: postId,
      user: id // ✅ Also link comment to user (optional but good practice)
    });

    // 3. Push comment into post's comments array
    await Post.findByIdAndUpdate(postId, {
      $push: { comments: createdComment._id }
    });

    // 4. Return response
    res.status(201).json({
      success: true,
      message: "Comment Created!",
      user: currentUser,
      comment: createdComment
    });

  } catch (error) {
    console.error("Error creating comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error!",
    });
  }
};


const readComment = async (req,res) =>{
   try {
     const {postId} = req.params;
     let particularPost = await Post.findById(postId).populate('comments');
     res.status(200).json(
      {
        success:true,
        message:"Comment Fetched Successfully!",
        postComments:particularPost  
      }
    ) 
   } catch (error) {
    return res.status(500).json(
      {
        success:false,
        message:"Internal Server Error!",
      }
    )
   }
}

const editComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found!"
      });
    }

    // ✅ Check if user field exists before calling .toString()
    if (!comment.user) {
      return res.status(400).json({
        success: false,
        message: "Comment has no user linked, cannot verify ownership!"
      });
    }

    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to edit this comment!"
      });
    }

    comment.content = content;
    const updatedComment = await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment updated successfully!",
      comment: updatedComment
    });

  } catch (error) {
    console.error("Error editing comment:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};



const deleteComment = async (req,res) =>{
      try {
        const {commentId} = req.params;
        let deletedComment = await Comment.findByIdAndDelete(commentId);
        res.status(201).json(
          {
            success:true,
            message:"Comment Deleted Successfully",
            comment:deleteComment
          }
        ) 
      } catch (error) {
        return res.status(500).json(
          {
            success:false,
            message:"Internal Server Error!"
          }
        )
      }
}

const savePost = async (req, res) => {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized! User not found" });
    }

    const { postId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $addToSet: { savedPosts: postId } }, // ✅ field name matches schema
      { new: true }
    ).populate("savedPosts"); // optional: populate with post details

    res.status(201).json({
      success: true,
      message: "Post Saved Successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error saving post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const unsavePost = async (req, res) => {
  try {
    const id = req.user?.id || req.user?._id;
    if (!id) {
      return res.status(401).json({ success: false, message: "Unauthorized! User not found" });
    }

    const { postId } = req.params;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $pull: { savedPosts: postId } },
      { new: true }
    ).populate("savedPosts");

    res.status(201).json({
      success: true,
      message: "Post Unsaved Successfully!",
      user: updatedUser
    });

  } catch (error) {
    console.error("Error unsaving post:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



module.exports = { createPost ,getPosts,getPostsByUser,likePost,dislikePost,commentPost,readComment,editComment,deleteComment ,savePost,unsavePost};

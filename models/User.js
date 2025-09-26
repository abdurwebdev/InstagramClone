// models/User.js
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  bio: String,
  avatar: String,
  savedPosts: [ // ✅ camelCase + directly store post IDs
    { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

module.exports = mongoose.model("User", userSchema);

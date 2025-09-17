const User = require('../models/User');
const bcrypt = require('bcrypt');

// ✅ Update Profile
const updateProfile = async (req, res) => {
  const { id } = req.user; // make sure req.user is set by auth middleware
  const { newusername, newemail, newpassword, newbio, newavatar } = req.body;

  try {
    let updatedFields = {
      username: newusername,
      email: newemail,
      bio: newbio,
      avatar: newavatar
    };

    // ✅ Hash password only if provided
    if (newpassword) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(newpassword, salt);
      updatedFields.password = hash;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updatedFields,
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Updated Successfully!", user: updatedUser });

  } catch (error) {
    console.error("Update Profile Error:", error);
    return res.status(500).json({ message: "Internal Server Error!" });
  }
};

// ✅ Get Profile
const getProfile = async (req, res) => {
  const { id } = req.user;

  try {
    const userProfile = await User.findById(id).select("-password");

    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User Found", user: userProfile });

  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ message: "Internal server error!" });
  }
};

// ✅ Follow User
const followUser = async (req, res) => {
  const { followUserId } = req.body;
  const currentUserId = req.user.id; // make sure auth middleware sets this

  try {
    if (followUserId === currentUserId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }
    
    // Add current user to the target user's followers array
    const followedUser = await User.findByIdAndUpdate(
      followUserId,
      { $addToSet: { followers: currentUserId } }, // prevent duplicates
      { new: true }
    );
    const updatedCurrentUser  = await User.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: followUserId } },
      { new: true }
    );
    


    if (!followedUser) {
      return res.status(404).json({ message: "User Not Found" });
    }

    return res.status(200).json({ message: "User Followed", user: followedUser,currentUser:updatedCurrentUser });

  } catch (error) {
    console.error("Follow User Error:", error);
    return res.status(500).json({ message: "Internal server Error!" });
  }
};

// ✅ Unfollow User
const unfollowUser = async (req, res) => {
  const { followUserId } = req.body;
  const currentUserId = req.user.id;

  try {
    // Remove current user from target user's followers array
    const unfollowedUser = await User.findByIdAndUpdate(
      followUserId,
      { $pull: { followers: currentUserId } },
      { new: true }
    );

    const updatedCurrentUser = await User.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: followUserId } },
      { new: true }
    );
    

    if (!unfollowedUser) {
      return res.status(404).json({ message: "User Not Found!" });
    }

    return res.status(200).json({ message: "Unfollowed", user: unfollowedUser ,currentUser:updatedCurrentUser});

  } catch (error) {
    console.error("Unfollow User Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { updateProfile, getProfile, followUser, unfollowUser };

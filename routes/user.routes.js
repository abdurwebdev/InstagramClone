const express = require('express');
const router = express.Router();
const {updateProfile,getProfile, followUser, unfollowUser} = require('../controllers/userController');
const {checkToken} = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const { createPost } = require('../controllers/postController');


router.post("/api/user/updateprofile",checkToken,updateProfile);
router.post("/api/user/getprofile",checkToken,getProfile);
router.post("/api/user/followuser",checkToken,followUser);
router.post("/api/user/unfollowuser",checkToken,unfollowUser);
router.post("/api/user/createpost",checkToken,upload.single('media'),createPost)
module.exports = router;
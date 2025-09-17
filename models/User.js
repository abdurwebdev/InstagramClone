const mongoose = require('mongoose');

const userSchema =  mongoose.Schema({
  username:String,
  email:String,
  password:String,
  bio:String,
  avatar:String,
  followers:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  following:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}]
})

module.exports = mongoose.model("User",userSchema);
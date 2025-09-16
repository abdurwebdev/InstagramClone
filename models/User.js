const mongoose = require('mongoose');

const userSchema =  mongoose.Schema({
  username:String,
  email:String,
  password:String,
  bio:String,
  avatar:String
})

module.exports = mongoose.model("User",userSchema);
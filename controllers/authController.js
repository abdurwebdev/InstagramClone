const User = require("../models/User");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');

const registerUser = async (req,res) =>{
  const {username,email,password,bio,avatar}= req.body;

  const user = await User.findOne({email});

  if(user){
    return res.status(400).json({message:"User already exists"});
  }

  try {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(password, salt,async function(err, hash) {
          
        const newUser = await User.create({username,email,password:hash,bio,avatar});
        
       res.status(201).json({message:"User created!"})

      });
  });
  } catch (error) {
    res.status(500).json({message:"Internal server Error!"});
  }

} 

const loginUser = async (req,res) =>{
  const {email,password} = req.body;

  try {
    const loginUserWithEmail = await User.findOne({email});
    

    if(!loginUserWithEmail){
       return res.status(400).json({message:"User Not Found"})
    }

    let loginPassword =await bcrypt.compare(password,loginUserWithEmail.password);

    if(loginUserWithEmail && loginPassword){
      var token = jwt.sign({id:loginUserWithEmail._id},process.env.JWT_SECRET,{expiresIn:"1h"})
      res.cookie("token",token,{
        httpOnly:true,
        secure:process.env.NODE_ENV==="production",
        sameSite:"strict",
      });
      res.status(201).json({message:"Login Successfull"})
    }
    else{
      res.status(400).json({message:"Invalid credentials"});
    }
  } catch (error) {
    res.status(500).json({message:"Internal Server Error"});
  }
}


const admin = (req,res) => {
  res.send("Admin Dashboard");
}

module.exports = {registerUser,loginUser,admin};
const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  type:{
    type:String,
    enum:['text','image','video'],
    required:true
  },
  title:{
    type:String,
    trim:true,
    maxLength:150
  },
  caption:{
    type:String,
    trim:true,
    maxLength:2000
  },
  mediaUrl:{
    type:String,
    required:function (){
      return this.type !== 'text';
    }
  },
  mediaPublicId:{
type:String
  },
  thumbnailUrl:{
    type:String,
    required:function (){
      return this.type === 'video';
    }
  },
  tags:[{
    type:String,
    trim:true
  }],
  comments:[
    {
      user:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
      text:{type:String,required:true},
      createdAt:{type:Date,default:Date.now}
    }
  ],
  views:{
    type:Number,
    default:0
  },
  isPublished:{
    type:Boolean,
    default:true
  }
},{
  timestamps:true
})

module.exports = mongoose.model("Post",postSchema);
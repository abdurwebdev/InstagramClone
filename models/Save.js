const mongoose = require('mongoose');
const saveSchema = mongoose.Schema({
  post:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Post"
  }]
})

module.exports = mongoose.model("Save",saveSchema);
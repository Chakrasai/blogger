const mongoose = require('mongoose');

const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  profilepic:{
    type:String,
    default:"default.jpeg"
  },
  posts : [
      {
          type:mongoose.Schema.Types.ObjectId,
          ref:"post"
      }
  ]
});

module.exports = mongoose.model('User', userschema);

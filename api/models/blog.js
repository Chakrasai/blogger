const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  image: { type: String }, 
});

const postModel = mongoose.model('Post', postSchema);

module.exports = postModel;

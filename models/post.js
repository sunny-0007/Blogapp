const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false    // ← THIS IS CRITICAL
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  name: { type: String, required: true },


  
  value: { type: Number, required: true },




  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Record', recordSchema);

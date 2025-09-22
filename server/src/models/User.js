const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'caretaker', 'parent'], required: true },
  child: {
    id: { type: String },
    name: { type: String }
  },
  assignedCaretaker: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedArea: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

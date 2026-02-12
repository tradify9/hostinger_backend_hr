const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['Performance', 'Incident', 'Feedback', 'Other'],
    default: 'Other',
  },
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed', 'Closed'],
    default: 'Submitted',
  },
  attachments: [{
    type: String, // URLs or paths to attachments
  }],
  submittedAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: {
    type: Date,
  },
  remarks: {
    type: String,
  },
});

module.exports = mongoose.model('Report', reportSchema);

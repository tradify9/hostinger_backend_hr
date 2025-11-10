const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },   // ✅ यहाँ comma missing था

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // जिस admin के under employee है
      required: true
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"]
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
      validate: {
        validator: function (value) {
          // End date must be >= start date
          return !this.startDate || value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date"
      }
    },

    reason: {
      type: String,
      required: [true, "Reason is required"],
      trim: true,
      minlength: [5, "Reason must be at least 5 characters long"]
    },

    leaveType: {
      type: String,
      required: false,
      default: 'Casual'
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Leave', leaveSchema);

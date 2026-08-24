const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: String, required: true, trim: true },
    reason: { type: String, default: "" },
    scheduledFor: { type: Date, required: true },

    status: {
      type: String,
      enum: ["requested", "confirmed", "cancelled"],
      default: "requested",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
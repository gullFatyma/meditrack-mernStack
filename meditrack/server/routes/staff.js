const express = require("express");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const protect = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

router.get(
  "/appointments",
  protect,
  requireRole("staff"),
  async (req, res) => {
    try {
      const appointments = await Appointment.find()
        .populate("owner", "name email")
        .sort({ scheduledFor: 1 });

      res.json({ appointments });
    } catch (err) {
      res.status(500).json({ msg: err.message });
    }
  }
);

router.patch(
  "/appointments/:id/status",
  protect,
  requireRole("staff"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["confirmed", "cancelled"].includes(status)) {
        return res.status(400).json({
          msg: "Status must be confirmed or cancelled",
        });
      }

      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status },
        {
          new: true,
          runValidators: true,
        }
      );

      if (!appointment) {
        return res.status(404).json({
          msg: "Appointment not found",
        });
      }

      res.json({ appointment });
    } catch (err) {
      res.status(400).json({ msg: err.message });
    }
  }
);

module.exports = router;

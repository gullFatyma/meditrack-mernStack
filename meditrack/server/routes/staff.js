const express = require("express");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const protect = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");

const router = express.Router();

/**
 * GET /api/staff/appointments
 * Staff members see EVERY appointment in the clinic, with the patient's name.
 * Order matters: protect first (who are you?), then requireRole (may you?).
 *
 * Hint: Appointment.find().populate("owner", "name email").sort({ scheduledFor: 1 })
 */
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

/**
 * PATCH /api/staff/appointments/:id/status
 * Staff may confirm or cancel ANY appointment - no owner filter here,
 * because the role itself is the permission.
 * Reject a status that is not "confirmed" or "cancelled" with 400.
 */
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

const express = require("express");
const Appointment = require("../models/Appointment");
const protect = require("../middleware/auth");
const router = express.Router();
router.use(protect);

router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find({
      owner: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({ appointments });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }

});


router.post("/", async (req, res) => {
  try {
    const appointment = await Appointment.create({
      ...req.body,
      owner: req.user.id,
    });

    res.status(201).json({ appointment });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user.id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    res.json({ appointment });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

/**
 * DELETE /api/appointments/:id
 * Same ownership filter, same 404.
 */
router.delete("/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    res.json({ msg: "Appointment deleted" });
  } catch (err) {
    res.status(400).json({ msg: err.message });
  }
});

module.exports = router;

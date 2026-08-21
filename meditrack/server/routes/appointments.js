const express = require("express");
const Appointment = require("../models/Appointment");
const protect = require("../middleware/auth");
const router = express.Router();
router.use(protect);

/**
 *  GET /api/appointments
 * Return ONLY the appointments whose owner is req.user.id, newest first.
 */
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


/**
 * POST /api/appointments
 * owner comes from the token (req.user.id), never from req.body.
 */
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


/**
 * TASK 6.5 - PUT /api/appointments/:id
 * Put BOTH _id and owner in the query so the database enforces ownership.
 * Nothing found -> 404 (never 403: a stranger must not learn the id exists).
 * Remember runValidators: true and new: true.
 */
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

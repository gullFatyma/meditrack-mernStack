const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const protect = require("../middleware/auth");

const router = express.Router();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// The response body carries the user only - never the token.
const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
});

//register route
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
    });

    res
      .cookie("token", signToken(user), cookieOptions)
      .status(201)
      .json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


//login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    res
      .cookie("token", signToken(user), cookieOptions)
      .status(200)
      .json({ user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

/**
 *  - GET /api/auth/me   (protected)
 * Rebuilds the session after a hard refresh: 200 = restore, 401 = show /login.
 */
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(401).json({ msg: "User not found" });
  }

  res.json({ user: publicUser(user) });
});



/**
 * POST /api/auth/logout
 * Only the server can delete an HttpOnly cookie. Pass the SAME cookieOptions.
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", cookieOptions);
  res.json({ msg: "Logged out" });
});


/**
 *  (BONUS) - POST /api/auth/forgot-password
 *   - always answer with the same generic message, whether or not the email exists
 *   - raw token: crypto.randomBytes(32).toString("hex")
 *   - store ONLY the sha256 hash of it, plus a 15 minute expiry
 *   - "email" the link by console.log-ing `${process.env.CLIENT_URL}/reset/${raw}`
 */
router.post("/forgot-password", async (req, res) => {
  const generic = { msg: "If that email exists, a reset link was sent" };

  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.json(generic);
    }

    const raw = crypto.randomBytes(32).toString("hex");

    const hash = crypto
      .createHash("sha256")
      .update(raw)
      .digest("hex");

    user.resetTokenHash = hash;
    user.resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    console.log(`${process.env.CLIENT_URL}/reset/${raw}`);

    res.json(generic);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});



/**
 *  - POST /api/auth/reset-password/:raw
 *   - hash req.params.raw and look the user up by resetTokenHash
 *   - the query must also require resetTokenExpires: { $gt: Date.now() }
 *   - re-hash the new password, then clear both reset fields
 */
router.post("/reset-password/:raw", async (req, res) => {
  try {
    const { password } = req.body;

    const hash = crypto
      .createHash("sha256")
      .update(req.params.raw)
      .digest("hex");

    const user = await User.findOne({
      resetTokenHash: hash,
      resetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid or expired reset token",
      });
    }

    user.password = await bcrypt.hash(password, 10);

    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;

    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

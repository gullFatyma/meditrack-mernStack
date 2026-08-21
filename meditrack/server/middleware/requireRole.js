/**
 * requireRole is a middleware FACTORY: requireRole("staff") returns a middleware.
 *
 *   - no req.user            -> 401 (we do not know you)
 *   - role not in allowed    -> 403 (we know you, and the answer is no)
 *   - otherwise              -> next()
 *
 * Use rest parameters so requireRole("staff", "admin") also works.
 * It must always run AFTER protect, because it reads req.user.
 */
function requireRole(...allowed) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ msg: "Not authorised" });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ msg: "Forbidden - insufficient role" });
    }

    next();
  };
}

module.exports = requireRole;
const jwt = require("jsonwebtoken");

/**
 * TASK 4.1 - The guard that stands in front of every private route.
 *
 * Steps:
 *   1. Read the token from req.cookies.token.
 *   2. TASK 4.4 (optional): if there is no cookie, fall back to the
 *      "Authorization: Bearer <token>" header so Postman and mobile clients work.
 *   3. If there is still no token -> 401.
 *   4. jwt.verify(token, process.env.JWT_SECRET) inside try/catch.
 *   5. On success put { id, role } on req.user and call next().
 *   6. On failure -> 401 "Token invalid or expired".
 *
 * A middleware has exactly two endings: it calls next(), or it ends the response.
 */

function protect(req, res, next) {
  let token = req.cookies.token;

    if (!token) {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.split(" ")[1];
      }
    }
  
  if (!token) 
    {
      return res.status(401).json({ msg: "Not authenticated" });
    }
    try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  req.user = {
    id: decoded.id,
    role: decoded.role,
  };

  next();
} catch (err) {
  return res.status(401).json({ msg: "Token invalid or expired" });
}
}

module.exports = protect;

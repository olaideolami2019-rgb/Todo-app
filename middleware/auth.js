
const jwt = require("jsonwebtoken");

function authenticateToken(token) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  return jwt.verify(token, process.env.JWT_SECRET);
}

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = authenticateToken(token);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

module.exports = {
  authMiddleware,
  authenticateToken,
};

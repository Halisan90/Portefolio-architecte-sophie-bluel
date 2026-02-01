const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    console.log("Auth header:", req.headers.authorization);
    const token = req.headers.authorization.split(" ")[1];
    console.log("Extracted token:", token.substring(0, 20) + "...");
    console.log("TOKEN_SECRET loaded:", !!process.env.TOKEN_SECRET);
    const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
    console.log("Token decoded, userId:", decodedToken.userId);
    const userId = decodedToken.userId;
    req.auth = { userId };
    if (req.body.userId && req.body.userId !== userId) {
      throw "Invalid user ID";
    } else {
      next();
    }
  } catch (err) {
    console.error("Auth error:", err.message || err);
    res.status(401).json({
      error: new Error("You are not authenticated"),
    });
  }
};

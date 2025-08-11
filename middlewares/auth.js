const UnauthorizedError = require("../errors/unauthorized");
const User = require("../api/users/users.model")
const jwt = require("jsonwebtoken");
const config = require("../config");

module.exports = async (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    if (!token) {
      throw "not token";
    }
    const decoded = jwt.verify(token, config.secretJwtToken);
    const user = await User.findById(decoded.userId).select("-password");
    if(!user) {
      throw "user not found";
    }
    req.user = user;
    next();
  } catch (message) {
    next(new UnauthorizedError(message));
  }
};

const ApiResponse = require("../utils/ApiResponse");

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return ApiResponse.unauthorized("Role not found").send(res);
    }

    if (!allowedRoles.includes(req.userRole)) {
      return ApiResponse.forbidden("Access denied").send(res);
    }

    next();
  };
};

module.exports = authorize;
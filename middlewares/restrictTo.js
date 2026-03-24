const UserErrors = require('../Errors/UserErrors');

const restrictTo = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(UserErrors.UnauthorizedUserAccess);
    }
    next();
  };
};

module.exports = restrictTo;
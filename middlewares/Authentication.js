const jwt = require('jsonwebtoken');
const util = require('util');
const UserErrors = require('../Errors/UserErrors');
const User = require("../models/user.model");

const jwtsign = util.promisify(jwt.sign);
const jwtverify = util.promisify(jwt.verify);

const Authentication = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    throw UserErrors.UnauthorizedUserAccess;
  }
  const bearerToken = token.split(' ')[1];

  try {
    
    const decoded = await jwtverify(bearerToken, process.env.JWT_SECRET);
    if (!decoded) {
      throw UserErrors.InvalidCredentialsError;
    }
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      throw UserErrors.InvalidCredentialsError;
    }
    const user = await User.findById(userId).select("_id role").lean();
    if (!user) {
      throw UserErrors.InvalidCredentialsError;
    }
    req.user = { ...decoded, userId: user._id, role: user.role };
    next();
  } catch (error) {
    throw UserErrors.InvalidCredentialsError;
  }
};

module.exports = {
  Authentication,
};
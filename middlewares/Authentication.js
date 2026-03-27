const jwt = require('jsonwebtoken');
const util = require('util');
const UserErrors = require('../Errors/UserErrors');
const User = require("../models/user.model");

const jwtverify = util.promisify(jwt.verify);

const Authentication = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer')) {
      return next(UserErrors.UnauthorizedUserAccess);
    }

    const bearerToken = token.split(' ')[1];
    const decoded = await jwtverify(bearerToken, process.env.JWT_SECRET);

    if (!decoded) {
      return next(UserErrors.InvalidCredentialsError);
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(UserErrors.InvalidCredentialsError);
  }
};

module.exports = { Authentication };
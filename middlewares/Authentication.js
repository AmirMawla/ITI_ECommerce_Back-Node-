const jwt = require('jsonwebtoken');
const util = require('util');
const UserErrors = require('../Errors/UserErrors');

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
    req.user = decoded;
    next();
  } catch (error) {
    throw UserErrors.InvalidCredentialsError;
  }
};

module.exports = {
  Authentication,
};
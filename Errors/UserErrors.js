const APIError = require('./APIError');

class UserErrors {
  static UserNotFound = new APIError('The specified user was not found.', 404);

  static EmailAlreadyExists = new APIError('A user with this email already exists.', 409);

  static InvalidCredentials = new APIError('Invalid email or password.', 401);

  static InvalidCredentialsError = new APIError('Invalid credentials.', 401);
  static WeakPassword = new APIError('Password must be at least 8 characters long.', 400);

  static InvalidUserData = new APIError('The provided user data is invalid.', 400);

  static UnauthorizedUserAccess = new APIError('You do not have permission to access this user.', 403);

  static UserAlreadyActive = new APIError('User is already active.', 409);

  static InvalidAge = new APIError('Age must be between 18 and 100.', 400);

  static InvalidResetToken = new APIError('Invalid or expired reset token.', 400);
  static ExpiredResetToken = new APIError('Reset token has expired.', 400);
  static InvalidOTP = new APIError('Invalid OTP code.', 400);
  static ExpiredOTP = new APIError('OTP has expired. Please request a new one.', 400);
  static OTPNotVerified = new APIError('Please verify your OTP before resetting password.', 400);
  static IncorrectPassword = new APIError('Incorrect password.', 400);
  static EmailSendFailed = new APIError('Failed to send email.', 400);
  static InvalidPasswordFormat = new APIError('Password must be at least 8 characters long.', 400);
  static PasswordsDoNotMatch = new APIError('Passwords do not match.', 400);
}

module.exports = UserErrors;
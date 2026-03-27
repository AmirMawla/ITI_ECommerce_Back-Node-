const APIError = require("./APIError");

class PaymentErrors {
  static NoTransactionsFound = new APIError("No transactions found.", 404);
  static NoRevenueData = new APIError("No revenue data found.", 404);
  static UserIdRequiredForAdmin = new APIError("User ID is required for admin users.", 400);
  static VendorIdRequiredForAdmin = new APIError("Vendor ID is required for admin users.", 400);
}

module.exports = PaymentErrors;

const APIError = require("./APIError");

class OrderErrors {
  static OrderNotFound = new APIError("Order not found.", 404);
  static AccessDenied = new APIError("You do not have permission to access this order.", 403);
  static VendorOrderNotFound = new APIError("No products found for this vendor in the order.", 404);
  static UserIdRequiredForAdmin = new APIError("User ID is required for admin users.", 400);
  static VendorIdRequiredForAdmin = new APIError("Vendor ID is required for admin users.", 400);
  static InvalidPagination = new APIError("Invalid pagination values.", 400);
}

module.exports = OrderErrors;

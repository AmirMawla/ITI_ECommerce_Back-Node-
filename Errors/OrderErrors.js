const APIError = require("./APIError");

class OrderErrors {
  static OrderNotFound = new APIError("Order not found.", 404);
  static AccessDenied = new APIError("You do not have permission to access this order.", 403);
  static VendorOrderNotFound = new APIError("No products found for this vendor in the order.", 404);
  static UserIdRequiredForAdmin = new APIError("User ID is required for admin users.", 400);
  static VendorIdRequiredForAdmin = new APIError("Vendor ID is required for admin users.", 400);
  static InvalidPagination = new APIError("Invalid pagination values.", 400);
  static CartNotFoundOrEmpty = new APIError("Cart not found or empty.", 404);
  static PaymentSessionCreationFailed = new APIError("Failed to create payment session.", 503);
  static InvalidWebhookSignature = new APIError("Invalid Kashier webhook signature.", 400);
  static InvalidShippingStatus = new APIError("Invalid shipping status.", 400);
  static ShippingNotFound = new APIError("Shipping record not found.", 404);
  static OrderAlreadyCancelled = new APIError("Order is already canceled.", 400);
  static OrderAlreadyDelivered = new APIError("Cannot cancel delivered order.", 400);
  static OrderCreationFailed = new APIError("Order creation failed.", 400);
  static PaymentNotFound = new APIError("Payment not found for this order.", 404);
  static InvalidOrderData = new APIError("Invalid order data.", 400);
}

module.exports = OrderErrors;

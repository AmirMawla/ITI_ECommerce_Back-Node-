const APIError = require("./APIError");


module.exports = {
  OrderNotFound: new APIError("Order not found.", 404),
  AccessDenied: new APIError("You do not have permission to access this order.", 403),
  VendorOrderNotFound: new APIError("No products found for this vendor in the order.", 404),
  UserIdRequiredForAdmin: new APIError("User ID is required for admin users.", 400),
  VendorIdRequiredForAdmin: new APIError("Vendor ID is required for admin users.", 400),
  InvalidPagination: new APIError("Invalid pagination values.", 400),
  CartNotFoundOrEmpty: new APIError("Cart not found or empty.", 404),
  PaymentSessionCreationFailed: new APIError("Failed to create payment session.", 503),
  InvalidWebhookSignature: new APIError("Invalid Kashier webhook signature.", 400),
  InvalidShippingStatus: new APIError("Invalid shipping status.", 400),
  ShippingNotFound: new APIError("Shipping record not found.", 404),
  OrderAlreadyCancelled: new APIError("Order is already canceled.", 400),
  OrderAlreadyDelivered: new APIError("Cannot cancel delivered order.", 400),
  OrderCreationFailed: new APIError("Order creation failed.", 400),
  PaymentNotFound: new APIError("Payment not found for this order.", 404),
  InvalidOrderData: new APIError("Invalid order data.", 400),
};

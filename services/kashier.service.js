const axios = require("axios");
const crypto = require("crypto");
const queryString = require("query-string");
const _ = require("underscore");

const httpClient = axios.create({
  baseURL: process.env.KASHIER_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: process.env.KASHIER_SECRET_KEY,
    "api-key": process.env.KASHIER_API_KEY,
  },
});

const createPaymentSession = async ({ amount, orderId, notes = "Order payment" }) => {
  const response = await httpClient.post("/v3/payment/sessions", {
    paymentType: "credit",
    amount: Number(amount).toFixed(2),
    currency: "EGP",
    order: orderId,
    display: "en",
    allowedMethods: "card,wallet",
    merchantRedirect: process.env.FRONTEND_URL || "https://example.com/redirect",
    redirectMethod: null,
    failureRedirect: false,
    iframeBackgroundColor: "#FFFFFF",
    merchantId: process.env.KASHIER_MERCHANT_ID,
    brandColor: "#5020FF",
    defaultMethod: "card",
    description: `Payment for order ${orderId}`,
    manualCapture: false,
    saveCard: "none",
    interactionSource: "ECOMMERCE",
    enable3DS: true,
    serverWebhook: process.env.WEBHOOK_URL,
    notes,
  });

  return response?.data;
};

const isValidWebhookSignature = (data, signatureHeader) => {
  if (!data || !Array.isArray(data.signatureKeys) || !signatureHeader) return false;
  data.signatureKeys.sort();
  const objectSignaturePayload = _.pick(data, data.signatureKeys);
  const signaturePayload = queryString.stringify(objectSignaturePayload);
  const signature = crypto
    .createHmac("sha256", process.env.KASHIER_API_KEY)
    .update(signaturePayload)
    .digest("hex");
  return signatureHeader === signature;
};

module.exports = {
  createPaymentSession,
  isValidWebhookSignature,
};
